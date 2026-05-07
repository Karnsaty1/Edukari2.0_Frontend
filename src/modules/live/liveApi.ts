import axios from 'axios';
import { readTokens } from '../auth/tokenStorage';
import type {
  LiveRoom,
  LiveMessage,
  LiveAttendance,
  LiveReaction,
  LiveRoomDetail,
  LiveJoinResponse,
  LiveGoLiveResponse,
  LiveSession,
} from '../../types/live';
import type { PaginationMeta } from '../../types/pagination';

const LIVE_BASE = (import.meta.env.VITE_LIVE_API_BASE_URL || 'http://localhost:5000/api/live').replace(/\/+$/, '');

const liveClient = axios.create({
  baseURL: LIVE_BASE,
  headers: { 'Content-Type': 'application/json' },
});

liveClient.interceptors.request.use((config) => {
  const tokens = readTokens();
  if (tokens?.accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

const r = async <T>(promise: Promise<{ data: T }>): Promise<T> => {
  const res = await promise;
  return res.data;
};

// Rooms
export const createRoom = (body: {
  title: string;
  description?: string;
  courseId?: string;
  scheduledStartAt?: string;
  maxAttendees?: number;
  isPublic?: boolean;
  slug?: string;
}): Promise<LiveRoom> => r(liveClient.post('/rooms', body));

export const searchRooms = (body: {
  q?: string;
  status?: LiveRoom['status'];
  courseId?: string;
  hostUserId?: string;
  isPublic?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ items: LiveRoom[]; meta: PaginationMeta }> => r(liveClient.post('/rooms/search', body));

export const getRoomDetail = (body: { roomId?: string; slug?: string }): Promise<LiveRoomDetail> =>
  r(liveClient.post('/rooms/detail', body));

export const goLive = (roomId: string): Promise<LiveGoLiveResponse> =>
  r(liveClient.post(`/rooms/${roomId}/go-live`));

export const endLive = (roomId: string): Promise<{ room: LiveRoom; session: LiveSession }> =>
  r(liveClient.post(`/rooms/${roomId}/end-live`));

export const joinRoom = (
  roomId: string,
  body: { displayName?: string; role?: LiveJoinResponse['role'] } = {}
): Promise<LiveJoinResponse> => r(liveClient.post(`/rooms/${roomId}/join`, body));

export const leaveRoom = (
  roomId: string
): Promise<{ participant: unknown | null; attendance: LiveAttendance | null }> =>
  r(liveClient.post(`/rooms/${roomId}/leave`));

// Messages
export const sendMessage = (
  roomId: string,
  body: { text: string; kind?: 'message' | 'announcement'; displayName?: string }
): Promise<LiveMessage> => r(liveClient.post(`/rooms/${roomId}/messages`, body));

export const searchMessages = (
  roomId: string,
  body: { page?: number; pageSize?: number }
): Promise<{ items: LiveMessage[]; meta: PaginationMeta }> =>
  r(liveClient.post(`/rooms/${roomId}/messages/search`, body));

// Attendance
export const heartbeat = (
  roomId: string,
  body: { watchSeconds?: number; isPresent?: boolean; displayName?: string } = {}
): Promise<LiveAttendance> => r(liveClient.post(`/rooms/${roomId}/attendance`, body));

// Participants
export const getParticipantCounts = (
  roomId: string
): Promise<{ total: number; active: number; left: number }> =>
  r(liveClient.get(`/rooms/${roomId}/participants/counts`));

// Reactions
export const sendReaction = (
  roomId: string,
  body: { type: LiveReaction['type']; displayName?: string }
): Promise<LiveReaction> => r(liveClient.post(`/rooms/${roomId}/reactions`, body));
