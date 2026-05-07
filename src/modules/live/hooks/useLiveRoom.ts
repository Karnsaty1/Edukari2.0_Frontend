import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  joinRoom,
  leaveRoom,
  sendMessage,
  sendReaction,
  heartbeat,
  getParticipantCounts,
} from '../liveApi';
import {
  getLiveSocket,
  disconnectLiveSocket,
  emitJoinRoom,
  emitLeaveRoom,
  emitChatSend,
  emitHeartbeat,
  emitReaction,
} from '../liveSocket';
import type { LiveMessage, LiveParticipant, LiveReaction, LiveRoom, LiveSession } from '../../../types/live';
import { readTokens } from '../../auth/tokenStorage';

interface UseLiveRoomOptions {
  roomId: string;
  displayName?: string;
}

interface UseLiveRoomState {
  room: LiveRoom | null;
  session: LiveSession | null;
  livekitToken: string | null;
  livekitUrl: string | null;
  role: string;
  messages: LiveMessage[];
  participants: LiveParticipant[];
  reactions: LiveReaction[];
  counts: { total: number; active: number; left: number };
  joined: boolean;
  loading: boolean;
  error: string | null;
}

export const useLiveRoom = ({ roomId, displayName }: UseLiveRoomOptions) => {
  const [state, setState] = useState<UseLiveRoomState>({
    room: null,
    session: null,
    livekitToken: null,
    livekitUrl: null,
    role: 'attendee',
    messages: [],
    participants: [],
    reactions: [],
    counts: { total: 0, active: 0, left: 0 },
    joined: false,
    loading: false,
    error: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchSecondsRef = useRef(0);

  const join = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await joinRoom(roomId, { displayName });
      const tokens = readTokens();
      const socket = getLiveSocket(tokens?.accessToken || '');
      socketRef.current = socket;

      socket.on('chat:new', (m: LiveMessage) =>
        // Deduplicate: drop if an optimistic message with same text+displayName exists
        setState((s) => {
          const isDuplicate = s.messages.some(
            (x) => x.id.startsWith('optimistic-') && x.text === m.text && x.displayName === m.displayName
          );
          if (isDuplicate) {
            // Replace the optimistic entry with the real one from server
            return {
              ...s,
              messages: s.messages.map((x) =>
                x.id.startsWith('optimistic-') && x.text === m.text && x.displayName === m.displayName
                  ? m
                  : x
              ),
            };
          }
          return { ...s, messages: [...s.messages, m] };
        })
      );
      socket.on('participant:joined', (p: LiveParticipant) =>
        setState((s) => ({ ...s, participants: [...s.participants, p] }))
      );
      socket.on('participant:left', (p: LiveParticipant) =>
        setState((s) => ({
          ...s,
          participants: s.participants.map((x) => (x.id === p.id ? p : x)),
        }))
      );
      socket.on('reaction:new', (r: LiveReaction) => {
        setState((s) => {
          const isDuplicate = s.reactions.some(
            (x) => x.id.startsWith('optimistic-') && x.type === r.type && x.displayName === r.displayName
          );
          if (isDuplicate) return s; // sender already sees it optimistically
          const next = [...s.reactions.slice(-49), r];
          setTimeout(() => {
            setState((ss) => ({ ...ss, reactions: ss.reactions.filter((x) => x.id !== r.id) }));
          }, 3000);
          return { ...s, reactions: next };
        });
      });

      socket.on('participant:counts', (c: { total: number; active: number; left: number }) =>
        setState((s) => ({ ...s, counts: c }))
      );

      // When host goes live / ends live, server broadcasts room:updated
      socket.on('room:updated', (updatedRoom: LiveRoom) =>
        setState((s) => ({ ...s, room: updatedRoom }))
      );

      emitJoinRoom(socket, { roomId, role: res.role, displayName });

      // Set role immediately so host detection works before livekitToken resolves
      setState((s) => ({ ...s, role: res.role, room: res.room }));

      // If room is already live but token is null, re-join immediately to get token
      if (res.room?.status === 'live' && !res.token) {
        const retryRes = await joinRoom(roomId, { displayName });
        if (retryRes.token) {
          setState((s) => ({
            ...s,
            room: retryRes.room,
            session: retryRes.session,
            livekitToken: retryRes.token,
            livekitUrl: retryRes.livekitUrl,
            role: retryRes.role,
            joined: true,
            loading: false,
          }));
          return;
        }
      }

      // Seed counts from HTTP
      getParticipantCounts(roomId)
        .then((c) => setState((s) => ({ ...s, counts: c })))
        .catch(() => {});

      // Heartbeat every 30s — prefer socket, fall back to HTTP if disconnected
      heartbeatRef.current = setInterval(() => {
        watchSecondsRef.current += 30;
        if (socket.connected) {
          emitHeartbeat(socket, { roomId, watchSeconds: watchSecondsRef.current, isPresent: true, displayName });
        } else {
          heartbeat(roomId, { watchSeconds: watchSecondsRef.current, isPresent: true, displayName }).catch(() => {});
        }
      }, 30_000);

      setState((s) => ({
        ...s,
        room: res.room,
        session: res.session,
        livekitToken: res.token,
        livekitUrl: res.livekitUrl,
        role: res.role,
        joined: true,
        loading: false,
      }));
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message || 'Failed to join room' }));
    }
  }, [roomId, displayName]);

  const leave = useCallback(async () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (socketRef.current) {
      emitLeaveRoom(socketRef.current, roomId);
      socketRef.current.removeAllListeners();
    }
    disconnectLiveSocket();
    await leaveRoom(roomId).catch(() => {});
    setState((s) => ({ ...s, joined: false, livekitToken: null }));
  }, [roomId]);

  const chat = useCallback(
    async (text: string, kind: 'message' | 'announcement' = 'message') => {
      // Optimistically add the message locally for the sender
      const optimistic: LiveMessage = {
        id: `optimistic-${Date.now()}`,
        roomId,
        userId: '',
        displayName: displayName || 'You',
        kind,
        text,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };
      setState((s) => ({ ...s, messages: [...s.messages, optimistic] }));
      await sendMessage(roomId, { text, kind, displayName });
    },
    [roomId, displayName]
  );

  const react = useCallback(
    async (type: LiveReaction['type']) => {
      const optimistic: LiveReaction = {
        id: `optimistic-${Date.now()}`,
        roomId,
        userId: '',
        displayName: displayName || 'You',
        type,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };
      setState((s) => ({ ...s, reactions: [...s.reactions.slice(-49), optimistic] }));
      setTimeout(() => {
        setState((s) => ({ ...s, reactions: s.reactions.filter((x) => x.id !== optimistic.id) }));
      }, 3000);
      await sendReaction(roomId, { type, displayName });
    },
    [roomId, displayName]
  );

  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  const setLivekitCredentials = useCallback((token: string, url: string, room: any, session: any) => {
    setState((s) => ({ ...s, livekitToken: token, livekitUrl: url, room, session }));
  }, []);

  return { ...state, join, leave, chat, react, setLivekitCredentials };
};
