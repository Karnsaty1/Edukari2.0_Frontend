import { io, Socket } from 'socket.io-client';
import type { LiveMessage, LiveParticipant, LiveAttendance, LiveReaction } from '../../types/live';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000').replace(/\/+$/, '');

export interface LiveSocketEvents {
  'participant:joined': (p: LiveParticipant) => void;
  'participant:left': (p: LiveParticipant) => void;
  'chat:new': (m: LiveMessage) => void;
  'attendance:update': (a: LiveAttendance) => void;
  'reaction:new': (r: LiveReaction) => void;
}

let socket: Socket | null = null;

export const getLiveSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  return socket;
};

export const disconnectLiveSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const emitJoinRoom = (
  s: Socket,
  payload: { roomId: string; role?: string; displayName?: string }
) => s.emit('room:join', payload);

export const emitLeaveRoom = (s: Socket, roomId: string) =>
  s.emit('room:leave', { roomId });

export const emitChatSend = (
  s: Socket,
  payload: { roomId: string; text: string; kind?: string; displayName?: string }
) => s.emit('chat:send', payload);

export const emitHeartbeat = (
  s: Socket,
  payload: { roomId: string; watchSeconds?: number; isPresent?: boolean; displayName?: string }
) => s.emit('attendance:heartbeat', payload);

export const emitReaction = (
  s: Socket,
  payload: { roomId: string; type: string; displayName?: string }
) => s.emit('reaction:send', payload);
