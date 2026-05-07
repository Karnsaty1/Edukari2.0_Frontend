import { useEffect, useRef, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  useRoomContext,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import SendIcon from '@mui/icons-material/Send';
import LogoutIcon from '@mui/icons-material/Logout';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import PanToolIcon from '@mui/icons-material/PanTool';
import CelebrationIcon from '@mui/icons-material/Celebration';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import StopIcon from '@mui/icons-material/Stop';
import { searchRooms, createRoom, goLive, endLive, joinRoom } from '../modules/live/liveApi';
import { useLiveRoom } from '../modules/live/hooks/useLiveRoom';
import { useAuth } from '../modules/auth';
import type { LiveRoom } from '../types/live';

const REACTION_ICONS: Record<string, React.ReactNode> = {
  like: <ThumbUpIcon fontSize="small" />,
  clap: <CelebrationIcon fontSize="small" />,
  heart: <FavoriteIcon fontSize="small" />,
  hand: <PanToolIcon fontSize="small" />,
  laugh: <span>😂</span>,
  wow: <span>😮</span>,
};

const StatusBadge = ({ status }: { status: LiveRoom['status'] }) => {
  const styles: Record<string, string> = {
    live: 'bg-red-500 text-white animate-pulse',
    scheduled: 'bg-yellow-400 text-yellow-900',
    draft: 'bg-gray-200 text-gray-600',
    ended: 'bg-gray-400 text-white',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${styles[status]}`}>
      {status === 'live' ? '● LIVE' : status}
    </span>
  );
};

const RoomCard = ({ room, onJoin }: { room: LiveRoom; onJoin: (room: LiveRoom) => void }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3 border border-gray-100">
    <div className="flex items-start justify-between gap-2">
      <h3 className="font-semibold text-gray-900 text-base leading-snug">{room.title}</h3>
      <StatusBadge status={room.status} />
    </div>
    {room.description && <p className="text-sm text-gray-500 line-clamp-2">{room.description}</p>}
    <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
      <span className="flex items-center gap-1">
        <PeopleIcon style={{ fontSize: 14 }} />
        {room.maxAttendees ?? '∞'}
      </span>
      {room.scheduledStartAt && (
        <span>{new Date(room.scheduledStartAt).toLocaleString()}</span>
      )}
    </div>
    <button
      onClick={() => onJoin(room)}
      disabled={room.status === 'ended'}
      className="mt-1 w-full py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {room.status === 'live' ? 'Join Now' : room.status === 'ended' ? 'Ended' : 'View Room'}
    </button>
  </div>
);

// ── Create Room Modal ────────────────────────────────────────────────────────
const CreateRoomModal = ({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (room: LiveRoom) => void;
}) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduledStartAt: '',
    maxAttendees: '300',
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const room = await createRoom({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        scheduledStartAt: form.scheduledStartAt || undefined,
        maxAttendees: Number(form.maxAttendees) || 300,
        isPublic: form.isPublic,
      });
      onCreated(room);
    } catch (e: any) {
      setError(e?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Create Live Room</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. React Hooks Deep Dive"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What will you cover?"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Scheduled Start</label>
              <input
                type="datetime-local"
                value={form.scheduledStartAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledStartAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Max Attendees</label>
              <input
                type="number"
                min={1}
                value={form.maxAttendees}
                onChange={(e) => setForm((f) => ({ ...f, maxAttendees: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
              className="accent-blue-500"
            />
            <span className="text-sm text-gray-700">Public room</span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Call UI (rendered inside LiveKitRoom context) ────────────────────────────
const CallUI = ({
  roomId,
  room,
  session,
  messages,
  reactions,
  counts,
  isHost,
  isElevated,
  hostLoading,
  onGoLive,
  onEndLive,
  onLeave,
  onChat,
  onReact,
}: {
  roomId: string;
  room: any;
  session: any;
  messages: any[];
  reactions: any[];
  counts: { total: number; active: number; left: number };
  isHost: boolean;
  isElevated: boolean;
  hostLoading: boolean;
  onGoLive: () => void;
  onEndLive: () => void;
  onLeave: () => void;
  onChat: (text: string) => void;
  onReact: (type: any) => void;
}) => {
  const { localParticipant } = useLocalParticipant();
  const lkRoom = useRoomContext();
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // All camera + screen share tracks from all participants
  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const allVideoTracks = [...screenTracks, ...cameraTracks];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!micOn);
    setMicOn((v) => !v);
  };

  const toggleCam = async () => {
    await localParticipant.setCameraEnabled(!camOn);
    setCamOn((v) => !v);
  };

  const toggleShare = async () => {
    await localParticipant.setScreenShareEnabled(!sharing);
    setSharing((v) => !v);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onChat(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-gray-950">
      {/* Main video area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-900/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <StatusBadge status={room?.status ?? 'draft'} />
            <span className="text-white font-medium text-sm truncate max-w-[160px]">{room?.title}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-md">
              <PeopleIcon style={{ fontSize: 13 }} className="text-gray-400" />
              <span className="text-white text-xs font-medium">{counts.active}</span>
            </div>
            <button
              onClick={onLeave}
              title="Leave"
              className="flex items-center gap-1 text-white/80 hover:text-white text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-md transition-colors"
            >
              <LogoutIcon style={{ fontSize: 14 }} /> Leave
            </button>
          </div>
        </div>

        {/* Video grid */}
        <div className="flex-1 overflow-hidden p-3">
          {allVideoTracks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-3">
                  <PeopleIcon style={{ fontSize: 40 }} className="text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">
                  {room?.status === 'live' ? 'No cameras on yet' : 'Waiting for host to go live...'}
                </p>
              </div>
            </div>
          ) : allVideoTracks.length === 1 ? (
            // Single participant — full screen
            <div className="h-full rounded-xl overflow-hidden">
              <VideoTrack trackRef={allVideoTracks[0]} className="w-full h-full object-cover" />
            </div>
          ) : (
            // Grid layout
            <div className={`grid h-full gap-2 ${
              allVideoTracks.length === 2 ? 'grid-cols-2' :
              allVideoTracks.length <= 4 ? 'grid-cols-2 grid-rows-2' :
              'grid-cols-3'
            }`}>
              {allVideoTracks.map((track) => (
                <div key={track.participant.sid} className="relative rounded-xl overflow-hidden bg-gray-800">
                  <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                    {track.participant.name || track.participant.identity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating reactions */}
        <div className="absolute bottom-20 left-4 flex gap-1 pointer-events-none">
          {reactions.map((r) => (
            <span key={r.id} className="text-2xl animate-[floatUp_3s_ease-out_forwards]">
              {r.type === 'like' ? '👍' : r.type === 'clap' ? '👏' : r.type === 'heart' ? '❤️' : r.type === 'hand' ? '✋' : r.type === 'laugh' ? '😂' : '😮'}
            </span>
          ))}
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900/80 backdrop-blur-sm flex-wrap">
          {/* Mic */}
          <button
            onClick={toggleMic}
            title={micOn ? 'Mute' : 'Unmute'}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors text-sm ${
              micOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {micOn ? '🎙️' : '🔇'}
          </button>
          {/* Camera */}
          <button
            onClick={toggleCam}
            title={camOn ? 'Turn off camera' : 'Turn on camera'}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
              camOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <VideocamIcon style={{ fontSize: 18 }} />
          </button>
          {/* Screen share */}
          <button
            onClick={toggleShare}
            title={sharing ? 'Stop sharing' : 'Share screen'}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors text-sm ${
              sharing ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            🖥️
          </button>

          <div className="w-px h-6 bg-gray-700 mx-1" />

          {/* Reactions */}
          {Object.entries(REACTION_ICONS).map(([type, icon]) => (
            <button
              key={type}
              onClick={() => onReact(type as any)}
              title={type}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              {icon}
            </button>
          ))}

          {/* Host controls */}
          {isHost && (
            <>
              <div className="w-px h-6 bg-gray-700 mx-1" />
              {room?.status !== 'live' && room?.status !== 'ended' && (
                <button
                  onClick={onGoLive}
                  disabled={hostLoading}
                  title="Go Live"
                  className="flex items-center gap-1 text-white text-xs bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 font-medium"
                >
                  <VideocamIcon style={{ fontSize: 14 }} />
                  {hostLoading ? 'Starting...' : 'Go Live'}
                </button>
              )}
              {room?.status === 'live' && (
                <button
                  onClick={onEndLive}
                  disabled={hostLoading}
                  title="End session"
                  className="flex items-center gap-1 text-white text-xs bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 font-medium"
                >
                  <StopIcon style={{ fontSize: 14 }} />
                  {hostLoading ? 'Ending...' : 'End Session'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col bg-gray-900 border-l border-gray-800">
        <div className="px-4 py-3 border-b border-gray-800 font-semibold text-gray-200 text-sm flex items-center justify-between">
          <span>Live Chat</span>
          <span className="text-xs text-gray-500">
            {isElevated ? `${counts.active} active · ${counts.total} total` : `${counts.active} watching`}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-gray-500 text-sm mt-8">No messages yet. Say hi! 👋</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col gap-0.5 ${
              m.kind === 'announcement' ? 'bg-blue-900/40 rounded-lg px-3 py-2 border border-blue-700/30' : ''
            }`}>
              <span className="text-xs font-semibold text-blue-400">{m.displayName}</span>
              <span className="text-sm text-gray-200">{m.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="px-3 py-3 border-t border-gray-800 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Send a message..."
            className="flex-1 text-sm bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 placeholder-gray-500"
          />
          <button
            onClick={handleSend}
            className="h-9 w-9 flex items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <SendIcon fontSize="small" />
          </button>
        </div>
      </div>

      <RoomAudioRenderer />
    </div>
  );
};

// ── In Room ───────────────────────────────────────────────────────────────────
const InRoom = ({
  roomId,
  displayName,
  onLeave,
  onRoomUpdated,
}: {
  roomId: string;
  displayName: string;
  onLeave: () => void;
  onRoomUpdated: (room: LiveRoom) => void;
}) => {
  const { room, session, livekitToken, livekitUrl, messages, reactions, counts, loading, error, role, join, leave, chat, react, setLivekitCredentials } =
    useLiveRoom({ roomId, displayName });

  const [hostLoading, setHostLoading] = useState(false);
  const isHost = role === 'host';
  const isElevated = isHost || role === 'teacher' || role === 'moderator';

  useEffect(() => { join(); }, []);

  // If room becomes live via socket (room:updated) and we don't have a token yet, re-join to get token
  const roomStatus = room?.status;
  useEffect(() => {
    if (roomStatus === 'live' && !livekitToken && !loading) {
      join();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomStatus]);

  const handleLeave = async () => { await leave(); onLeave(); };

  const handleGoLive = async () => {
    setHostLoading(true);
    try {
      const res = await goLive(roomId);
      const joinRes = await joinRoom(roomId, { displayName });
      setLivekitCredentials(joinRes.token ?? '', joinRes.livekitUrl ?? '', res.room, res.session);
    } finally {
      setHostLoading(false);
    }
  };

  const handleEndLive = async () => {
    setHostLoading(true);
    try {
      const res = await endLive(roomId);
      setLivekitCredentials('', '', res.room, res.session);
      onRoomUpdated(res.room);
    } finally {
      setHostLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-950">
        <div className="text-blue-400 font-semibold animate-pulse">Joining room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-gray-950 gap-4">
        <p className="text-red-400 font-medium">{error}</p>
        <button onClick={onLeave} className="px-4 py-2 bg-gray-800 text-gray-200 rounded-lg text-sm">Go Back</button>
      </div>
    );
  }

  if (!livekitToken || !livekitUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-gray-950 gap-6">
        <div className="text-center">
          <StatusBadge status={room?.status ?? 'draft'} />
          <p className="text-white font-semibold text-lg mt-3">{room?.title}</p>
          <p className="text-gray-400 text-sm mt-1">
            {room?.status === 'ended'
              ? 'This session has ended.'
              : isHost
              ? 'You are the host. Start the session when ready.'
              : 'Waiting for the host to start the session...'}
          </p>
          {!isHost && room?.status !== 'ended' && (
            <p className="text-gray-600 text-xs mt-2">You will be connected automatically when the host goes live.</p>
          )}
        </div>
        {isHost && room?.status !== 'live' && room?.status !== 'ended' && (
          <button
            onClick={handleGoLive}
            disabled={hostLoading}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <VideocamIcon fontSize="small" /> {hostLoading ? 'Starting...' : 'Go Live'}
          </button>
        )}
        {isHost && room?.status === 'live' && (
          <button
            onClick={handleEndLive}
            disabled={hostLoading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <StopIcon fontSize="small" /> {hostLoading ? 'Ending...' : 'End Session'}
          </button>
        )}
        <button onClick={handleLeave} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          Leave room
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={livekitToken}
      serverUrl={livekitUrl}
      connect={true}
      className="h-[calc(100vh-64px)]"
    >
      <CallUI
        roomId={roomId}
        room={room}
        session={session}
        messages={messages}
        reactions={reactions}
        counts={counts}
        isHost={isHost}
        isElevated={isElevated}
        hostLoading={hostLoading}
        onGoLive={handleGoLive}
        onEndLive={handleEndLive}
        onLeave={handleLeave}
        onChat={chat}
        onReact={react}
      />
    </LiveKitRoom>
  );
};

const Live = () => {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const displayName: string = profile?.firstname
    ? `${profile.firstname} ${profile.lastname || ''}`.trim()
    : (user as any)?.email || 'Guest';

  const loadRooms = async (search?: string) => {
    setLoading(true);
    try {
      const res = await searchRooms({ q: search || undefined, pageSize: 20 });
      setRooms(res.items);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => loadRooms(q), q ? 400 : 0);
    return () => clearTimeout(t);
  }, [q]);

  if (activeRoomId) {
    return (
      <InRoom
        roomId={activeRoomId}
        displayName={displayName}
        onLeave={() => {
          setActiveRoomId(null);
          loadRooms(q);
        }}
        onRoomUpdated={(updated) =>
          setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        }
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(room) => {
            setShowCreateModal(false);
            setRooms((prev) => [room, ...prev]);
            setActiveRoomId(room.id);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Rooms</h1>
          <p className="text-gray-500 mt-1">Join a live session or start your own</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <AddIcon fontSize="small" /> Create Room
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fontSize="small" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search rooms..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white"
        />
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No rooms found</p>
          <p className="text-sm mt-1">Try a different search or check back later</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onJoin={(r) => setActiveRoomId(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Live;
