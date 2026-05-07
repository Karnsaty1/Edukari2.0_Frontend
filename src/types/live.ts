export interface LiveRoom {
  id: string;
  title: string;
  slug: string;
  description: string;
  courseId: string | null;
  hostUserId: string;
  status: 'draft' | 'scheduled' | 'live' | 'ended';
  provider: 'livekit';
  providerRoomName: string;
  scheduledStartAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  maxAttendees: number | null;
  isPublic: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LiveSession {
  id: string;
  roomId: string;
  provider: 'livekit';
  providerRoomName: string;
  status: 'live' | 'ended';
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LiveParticipant {
  id: string;
  roomId: string;
  userId: string;
  role: 'host' | 'teacher' | 'moderator' | 'attendee';
  displayName: string;
  isActive: boolean;
  joinedAt: string | null;
  leftAt: string | null;
  lastSeenAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LiveMessage {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  kind: 'message' | 'announcement';
  text: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LiveAttendance {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  watchSeconds: number;
  isPresent: boolean;
  joinedAt: string | null;
  leftAt: string | null;
  lastHeartbeatAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LiveReaction {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  type: 'like' | 'clap' | 'heart' | 'hand' | 'laugh' | 'wow';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LiveRoomDetail {
  room: LiveRoom;
  latestSession: LiveSession | null;
  counts: {
    participants: number;
    activeParticipants: number;
    messages: number;
    attendance: number;
  };
  recentParticipants: LiveParticipant[];
  recentMessages: LiveMessage[];
  recentAttendance: LiveAttendance[];
}

export interface LiveJoinResponse {
  room: LiveRoom;
  session: LiveSession | null;
  token: string | null;
  livekitUrl: string | null;
  role: string;
}

export interface LiveGoLiveResponse {
  room: LiveRoom;
  session: LiveSession;
  token: string | null;
  livekitUrl: string | null;
}
