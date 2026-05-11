import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import VideocamIcon from '@mui/icons-material/Videocam';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BlockIcon from '@mui/icons-material/Block';
import { getRoomDetail } from '../modules/live/liveApi';
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
    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${styles[status]}`}>
      {status === 'live' ? '● LIVE' : status}
    </span>
  );
};

const LiveJoin = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthed, isLoading: authLoading } = useAuth();

  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [counts, setCounts] = useState<{ activeParticipants: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load room details
  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const detail = await getRoomDetail({ slug });
        setRoom(detail.room);
        setCounts(detail.counts);
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 410) setError('ended');
        else if (status === 403) setError('draft');
        else setError('notfound');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  // Auto-join when logged in and room is loaded
  useEffect(() => {
    if (isAuthed && room && !authLoading && !loading) {
      navigate(`/live`, { state: { joinRoomId: room.id } });
    }
  }, [isAuthed, room, authLoading, loading, navigate]);

  const handleJoin = () => {
    if (!isAuthed) {
      navigate(`/login?next=/live/s/${slug}`);
      return;
    }
    navigate(`/live`, { state: { joinRoomId: room?.id } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
        <div className="text-white font-semibold animate-pulse">Loading room...</div>
      </div>
    );
  }

  // Error states
  if (error === 'ended') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <BlockIcon style={{ fontSize: 32 }} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Session Ended</h2>
          <p className="text-gray-500 text-sm mt-2">This live session has already ended.</p>
          <button onClick={() => navigate('/live')} className="mt-6 w-full py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors">
            Browse Live Rooms
          </button>
        </div>
      </div>
    );
  }

  if (error === 'draft') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <AccessTimeIcon style={{ fontSize: 32 }} className="text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Room Not Open Yet</h2>
          <p className="text-gray-500 text-sm mt-2">This room isn't open for joining yet. Check back when the host goes live.</p>
          <button onClick={() => navigate('/live')} className="mt-6 w-full py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors">
            Browse Live Rooms
          </button>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-fade-in-up">
          <h2 className="text-xl font-bold text-gray-900">Room Not Found</h2>
          <p className="text-gray-500 text-sm mt-2">This link may be invalid or the room no longer exists.</p>
          <button onClick={() => navigate('/live')} className="mt-6 w-full py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors">
            Browse Live Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Orbs */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-blue-400/30 blur-3xl animate-orb-1 pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full bg-indigo-500/25 blur-3xl animate-orb-2 pointer-events-none" />

      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-blue-600 tracking-tight mb-4">
            Edu<span className="text-yellow-400">kari</span>
          </div>
          <StatusBadge status={room.status} />
        </div>

        {/* Room info */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{room.title}</h2>
          {room.description && (
            <p className="text-gray-500 text-sm mt-2">{room.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mb-6 text-sm text-gray-500">
          {counts && (
            <span className="flex items-center gap-1.5">
              <PeopleIcon style={{ fontSize: 16 }} className="text-blue-400" />
              {counts.activeParticipants} watching
            </span>
          )}
          {room.scheduledStartAt && room.status === 'scheduled' && (
            <span className="flex items-center gap-1.5">
              <AccessTimeIcon style={{ fontSize: 16 }} className="text-blue-400" />
              {new Date(room.scheduledStartAt).toLocaleString()}
            </span>
          )}
          {room.maxAttendees && (
            <span className="flex items-center gap-1.5">
              <PeopleIcon style={{ fontSize: 16 }} className="text-gray-400" />
              Max {room.maxAttendees}
            </span>
          )}
        </div>

        {/* Join button */}
        <button
          onClick={handleJoin}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors animate-pulse-glow"
        >
          <VideocamIcon fontSize="small" />
          {room.status === 'live' ? 'Join Now' : 'Enter Room'}
        </button>

        {!isAuthed && (
          <p className="text-center text-xs text-gray-400 mt-3">You'll be asked to sign in first</p>
        )}
      </div>
    </div>
  );
};

export default LiveJoin;
