import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  useParticipants,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import SendIcon from '@mui/icons-material/Send';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsIcon from '@mui/icons-material/Settings';
import ShareIcon from '@mui/icons-material/Share';
import ChatIcon from '@mui/icons-material/Chat';
import { searchRooms, createRoom, goLive, endLive, joinRoom, getParticipantCounts } from '../modules/live/liveApi';
import { createLiveRoomSchema, sendLiveMessageSchema } from '../modules/live/liveValidation';
import { useLiveRoom } from '../modules/live/hooks/useLiveRoom';
import { useAuth } from '../modules/auth';
import type { LiveRoom } from '../types/live';

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

const RoomCard = ({ room, activeCounts, onJoin }: { room: LiveRoom; activeCounts?: number; onJoin: (room: LiveRoom) => void }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3 border border-gray-100 shimmer-card animate-fade-in-up">
    <div className="flex items-start justify-between gap-2">
      <h3 className="font-semibold text-gray-900 text-base leading-snug">{room.title}</h3>
      <StatusBadge status={room.status} />
    </div>
    {room.description && <p className="text-sm text-gray-500 line-clamp-2">{room.description}</p>}
    <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
      <span className="flex items-center gap-1">
        <PeopleIcon style={{ fontSize: 14 }} />
        {room.status === 'live'
          ? <>{activeCounts ?? '...'} <span className="text-red-400 font-medium">live</span></>
          : room.maxAttendees ?? '∞'
        }
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      scheduledStartAt: form.scheduledStartAt || undefined,
      maxAttendees: Number(form.maxAttendees) || 300,
      isPublic: form.isPublic,
    };

    try {
      await createLiveRoomSchema.validate(payload, { abortEarly: false });
    } catch (err: any) {
      const errors: Record<string, string> = {};
      err.inner?.forEach((e: any) => { if (e.path) errors[e.path] = e.message; });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const room = await createRoom(payload);
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
              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 ${
                fieldErrors.title ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
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
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 ${
                  fieldErrors.scheduledStartAt ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {fieldErrors.scheduledStartAt && <p className="text-xs text-red-500 mt-1">{fieldErrors.scheduledStartAt}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Max Attendees</label>
              <input
                type="number"
                min={1}
                max={10000}
                value={form.maxAttendees}
                onChange={(e) => setForm((f) => ({ ...f, maxAttendees: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 ${
                  fieldErrors.maxAttendees ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {fieldErrors.maxAttendees && <p className="text-xs text-red-500 mt-1">{fieldErrors.maxAttendees}</p>}
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

// ── Device Settings Panel ─────────────────────────────────────────────────────
const DeviceSettingsPanel = ({
  onClose,
  localParticipant,
}: {
  onClose: () => void;
  localParticipant: any;
}) => {
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cams, setCams] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [selectedCam, setSelectedCam] = useState('');
  const [volume, setVolume] = useState(0);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setMics(devices.filter((d) => d.kind === 'audioinput'));
      setCams(devices.filter((d) => d.kind === 'videoinput'));
    });
  }, []);

  // Mic volume meter using AudioContext
  useEffect(() => {
    let ctx: AudioContext;
    const startMeter = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
          video: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setVolume(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {}
    };
    startMeter();
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctx?.close();
    };
  }, [selectedMic]);

  const applyMic = async () => {
    if (selectedMic) await localParticipant.switchActiveDevice('audioinput', selectedMic);
  };

  const applyCam = async () => {
    if (selectedCam) await localParticipant.switchActiveDevice('videoinput', selectedCam);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-900 font-semibold">Device Settings</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <CloseIcon style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Microphone */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 font-medium block mb-1.5">Microphone</label>
          <select
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400"
          >
            <option value="">Default</option>
            {mics.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 8)}`}</option>
            ))}
          </select>

          {/* Volume meter */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Input level</span>
              <span className="text-xs text-gray-400">{volume}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  volume > 70 ? 'bg-red-500' : volume > 40 ? 'bg-yellow-400' : 'bg-green-500'
                }`}
                style={{ width: `${volume}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Speak to test your microphone</p>
          </div>

          <button
            onClick={applyMic}
            className="mt-2 text-xs text-blue-500 hover:text-blue-600 transition-colors"
          >
            Apply microphone
          </button>
        </div>

        {/* Camera */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 font-medium block mb-1.5">Camera</label>
          <select
            value={selectedCam}
            onChange={(e) => setSelectedCam(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400"
          >
            <option value="">Default</option>
            {cams.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 8)}`}</option>
            ))}
          </select>
          <button
            onClick={applyCam}
            className="mt-2 text-xs text-blue-500 hover:text-blue-600 transition-colors"
          >
            Apply camera
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};

// ── Call UI (rendered inside LiveKitRoom context) ────────────────────────────
const CallUI = ({
  room,
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
  room: any;
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
  onReact: (emoji: string) => void;
}) => {
  const { localParticipant, isSpeaking } = useLocalParticipant();
  const participants = useParticipants();

  const [isMobile, setIsMobile] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync showChat with isMobile after mount
  useEffect(() => {
    setShowChat(!isMobile);
  }, [isMobile]);

  const handleShare = () => {
    if (!room?.slug) return;
    const link = `${window.location.origin}/live/s/${room.slug}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const [text, setText] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  // Screen share takes priority as dominant view
  const dominantTrack = screenTracks[0] ?? cameraTracks[0] ?? null;
  // Remaining camera tracks shown in strip
  const stripTracks = dominantTrack
    ? cameraTracks.filter((t) => t !== dominantTrack)
    : cameraTracks.slice(1);

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

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await sendLiveMessageSchema.validate({ text: text.trim() });
      setChatError(null);
      onChat(text.trim());
      setText('');
    } catch (err: any) {
      setChatError(err.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
      {showSettings && (
        <DeviceSettingsPanel
          onClose={() => setShowSettings(false)}
          localParticipant={localParticipant}
        />
      )}

      {/* ── Left: Video + Controls ── */}
      <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${isMobile ? (showChat ? 'h-[65%]' : 'h-[90%]') : ''}`}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <StatusBadge status={room?.status ?? 'draft'} />
            <span className="text-gray-800 font-semibold text-sm truncate max-w-[200px]">{room?.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
              <PeopleIcon style={{ fontSize: 14 }} className="text-gray-500" />
              <span className="text-gray-700 text-xs font-medium">{counts.active}</span>
            </div>
            <button
              onClick={handleShare}
              title="Copy share link"
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium transition-colors"
            >
              <ShareIcon style={{ fontSize: 13 }} />
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* Main video area */}
        <div className="flex-1 flex flex-col overflow-hidden p-2 gap-2 min-h-0">

          {/* Dominant view */}
          <div className="flex-1 relative rounded-xl md:rounded-2xl overflow-hidden bg-gray-800 min-h-[200px]">
            {dominantTrack ? (
              <>
                <VideoTrack trackRef={dominantTrack} className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {dominantTrack.participant.name || dominantTrack.participant.identity}
                  {screenTracks[0] === dominantTrack && ' 🖥️'}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center">
                  <PeopleIcon style={{ fontSize: 36 }} className="text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">No video yet — turn on your camera to start</p>
              </div>
            )}

            {/* Floating reactions */}
            <div className="absolute bottom-12 left-3 flex gap-1 pointer-events-none">
              {reactions.map((r) => (
                <span key={r.id} className="text-2xl animate-[floatUp_3s_ease-out_forwards]">
                  {r.type}
                </span>
              ))}
            </div>
          </div>

          {/* Participant strip */}
          {stripTracks.length > 0 && (
            <div className="flex gap-2 h-20 md:h-28 overflow-x-auto">
              {stripTracks.map((track) => (
                <div key={track.participant.sid} className="relative flex-shrink-0 w-44 rounded-xl overflow-hidden bg-gray-700">
                  <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                  <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {track.participant.name || track.participant.identity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Control bar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-t border-gray-200 shadow-sm">

          {/* Left: media controls */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={toggleMic}
              title={micOn ? 'Mute microphone' : 'Unmute microphone'}
              className={`relative h-8 w-8 md:h-9 md:w-9 rounded-full flex items-center justify-center transition-all ${
                micOn
                  ? isSpeaking
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {micOn && isSpeaking && (
                <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-50" />
              )}
              {micOn ? <MicIcon style={{ fontSize: 16 }} /> : <MicOffIcon style={{ fontSize: 16 }} />}
            </button>

            <button
              onClick={toggleCam}
              title={camOn ? 'Turn off camera' : 'Turn on camera'}
              className={`h-8 w-8 md:h-9 md:w-9 rounded-full flex items-center justify-center transition-colors ${
                camOn ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {camOn ? <VideocamIcon style={{ fontSize: 16 }} /> : <VideocamOffIcon style={{ fontSize: 16 }} />}
            </button>

            <button
              onClick={toggleShare}
              title={sharing ? 'Stop sharing screen' : 'Share screen'}
              className={`h-8 w-8 md:h-9 md:w-9 rounded-full flex items-center justify-center transition-colors ${
                sharing ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {sharing ? <StopScreenShareIcon style={{ fontSize: 16 }} /> : <ScreenShareIcon style={{ fontSize: 16 }} />}
            </button>

            <button
              onClick={() => setShowSettings(true)}
              title="Device settings"
              className="h-8 w-8 md:h-9 md:w-9 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
            >
              <SettingsIcon style={{ fontSize: 14 }} />
            </button>
          </div>

          {/* Center: reactions */}
          <button
            onClick={() => setShowReactions((v) => !v)}
            title="Send reaction"
            className={`h-8 w-8 md:h-9 md:w-9 rounded-full flex items-center justify-center transition-colors ${
              showReactions ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
            }`}
          >
            <EmojiEmotionsIcon style={{ fontSize: 16 }} />
          </button>

          {/* Right: host controls + leave */}
          <div className="flex items-center gap-1 md:gap-2">
            {isHost && room?.status !== 'live' && room?.status !== 'ended' && (
              <button
                onClick={onGoLive}
                disabled={hostLoading}
                title="Start live stream"
                className="h-8 w-8 md:h-9 md:w-9 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
              >
                <PlayArrowIcon style={{ fontSize: 16 }} />
              </button>
            )}
            {isHost && room?.status === 'live' && (
              <button
                onClick={onEndLive}
                disabled={hostLoading}
                title="End live stream"
                className="h-8 w-8 md:h-9 md:w-9 flex items-center justify-center rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50"
              >
                <StopIcon style={{ fontSize: 16 }} />
              </button>
            )}
            <button
              onClick={onLeave}
              title="Leave room"
              className="h-8 w-8 md:h-9 md:w-9 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              <LogoutIcon style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        {/* Emoji picker — floats above control bar */}
        {showReactions && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 shadow-2xl">
            <EmojiPicker
              theme={Theme.LIGHT}
              onEmojiClick={(data: EmojiClickData) => {
                onReact(data.emoji);
                setShowReactions(false);
              }}
              height={380}
              width={320}
            />
          </div>
        )}

        {/* Mobile: Chat always visible below video, no toggle button needed */}
      </div>

      {/* ── Right: Chat panel ── */}
      <div className={`${isMobile ? `flex flex-col ${showChat ? 'h-[35%]' : 'h-auto'}` : 'relative flex'}`}>
        {!isMobile && (
          <button
            onClick={() => setShowChat((v) => !v)}
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-5 h-12 bg-white hover:bg-gray-50 rounded-l-lg border border-gray-200 border-r-0 transition-colors shadow-sm"
            title={showChat ? 'Collapse chat' : 'Expand chat'}
          >
            <ChevronRightIcon
              style={{ fontSize: 16 }}
              className={`text-gray-400 transition-transform ${showChat ? '' : 'rotate-180'}`}
            />
          </button>
        )}

        {/* Chat header - always visible to toggle */}
        <button
          onClick={() => setShowChat((v) => !v)}
          className={`flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 w-full ${isMobile ? '' : 'hidden'}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-800 font-semibold text-sm">Live Chat</span>
            <span className="text-xs text-gray-400">{counts.active} watching</span>
          </div>
          <ChevronRightIcon
            style={{ fontSize: 16 }}
            className={`text-gray-400 transition-transform ${showChat ? 'rotate-90' : '-rotate-90'}`}
          />
        </button>

        {/* Chat content - only shown when showChat is true */}
        {showChat && (
          <div className={`flex flex-col bg-white ${isMobile ? 'flex-1 min-h-0' : 'border-l border-gray-200 w-80 xl:w-96'}`}>
            {!isMobile && (
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-gray-800 font-semibold text-sm">Live Chat</span>
                <span className="text-xs text-gray-400">{counts.active} watching</span>
              </div>
            )}

            <div className={`flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 ${isMobile ? 'min-h-0' : ''}`}>
              {messages.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hi! 👋</p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col gap-0.5 ${
                    m.kind === 'announcement'
                      ? 'bg-blue-50 rounded-lg px-3 py-2 border border-blue-100'
                      : ''
                  }`}
                >
                  <span className="text-xs font-semibold text-blue-600">{m.displayName}</span>
                  <span className="text-sm text-gray-700 break-words">{m.text}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-3 py-3 border-t border-gray-100 bg-white flex flex-col gap-1">
              {chatError && <p className="text-xs text-red-500 px-1">{chatError}</p>}
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => { setText(e.target.value); if (chatError) setChatError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Send a message..."
                  maxLength={1000}
                  className="flex-1 text-sm bg-gray-100 border border-gray-200 text-gray-800 rounded-xl px-3 py-2 outline-none focus:border-blue-400 placeholder-gray-400"
                />
                <button
                  onClick={handleSend}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <SendIcon fontSize="small" />
                </button>
              </div>
            </div>
          </div>
        )}
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
  const roomStatus = room?.status;

  useEffect(() => { join(); }, []);

  // If room is live but we have no token, keep retrying join every 2s until we get one
  useEffect(() => {
    if (roomStatus !== 'live' || livekitToken || loading) return;
    const interval = setInterval(async () => {
      try {
        const res = await joinRoom(roomId, { displayName });
        if (res.token && res.livekitUrl) {
          setLivekitCredentials(res.token, res.livekitUrl, res.room, res.session);
          clearInterval(interval);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomStatus, livekitToken, loading]);

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
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-50">
        <div className="text-blue-500 font-semibold animate-pulse">Joining room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-gray-50 gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={onLeave} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">Go Back</button>
      </div>
    );
  }

  if (!livekitToken || !livekitUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-gray-50 gap-6">
        <div className="text-center">
          <StatusBadge status={room?.status ?? 'draft'} />
          <p className="text-gray-900 font-semibold text-lg mt-3">{room?.title}</p>
          <p className="text-gray-500 text-sm mt-1">
            {room?.status === 'ended'
              ? 'This session has ended.'
              : isHost && room?.status === 'live'
              ? 'Session is live — connecting you...'
              : isHost
              ? 'You are the host. Start the session when ready.'
              : 'Waiting for the host to start the session...'}
          </p>
          {room?.status === 'live' && !isHost && (
            <p className="text-gray-400 text-xs mt-2">Connecting automatically...</p>
          )}
          {room?.status === 'live' && isHost && (
            <div className="mt-3 flex items-center justify-center gap-2 text-blue-500 text-sm">
              <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
              Fetching your session token...
            </div>
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
        <button onClick={handleLeave} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
          <LogoutIcon style={{ fontSize: 15 }} /> Leave room
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
        room={room}
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
  const location = useLocation();
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(
    (location.state as any)?.joinRoomId ?? null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});

  const displayName: string = profile?.firstname
    ? `${profile.firstname} ${profile.lastname || ''}`.trim()
    : (user as any)?.email || 'Guest';

  const loadRooms = async (search?: string) => {
    setLoading(true);
    try {
      const res = await searchRooms({ q: search || undefined, pageSize: 20 });
      setRooms(res.items);
      // Fetch active counts for live rooms in parallel
      const liveRooms = res.items.filter((r) => r.status === 'live');
      if (liveRooms.length > 0) {
        const counts = await Promise.allSettled(
          liveRooms.map((r) => getParticipantCounts(r.id))
        );
        const map: Record<string, number> = {};
        liveRooms.forEach((r, i) => {
          const result = counts[i];
          if (result.status === 'fulfilled') map[r.id] = result.value.active;
        });
        setLiveCounts(map);
      }
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
            <RoomCard key={room.id} room={room} activeCounts={liveCounts[room.id]} onJoin={(r) => setActiveRoomId(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Live;
