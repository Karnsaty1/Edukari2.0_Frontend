import * as yup from "yup";

const ROLES = ["host", "teacher", "moderator", "attendee"] as const;
const STATUSES = ["draft", "scheduled", "live", "ended"] as const;
const REACTION_TYPES = ["like", "clap", "heart", "hand", "laugh", "wow"] as const;
const MESSAGE_KINDS = ["message", "announcement"] as const;
const OBJECTID_REGEX = /^[a-f\d]{24}$/i;

// ─── Create Room ─────────────────────────────────────────────────────────────
export const createLiveRoomSchema = yup.object({
  title: yup.string().trim().required("Title is required").max(100),
  description: yup.string().trim().max(500).nullable().optional(),
  courseId: yup
    .string()
    .matches(OBJECTID_REGEX, "Invalid courseId")
    .nullable()
    .optional(),
  scheduledStartAt: yup
    .string()
    .test("is-future", "Scheduled time must be in the future", (val) => {
      if (!val) return true;
      return new Date(val) > new Date();
    })
    .nullable()
    .optional(),
  maxAttendees: yup.number().min(1).max(10000).integer().nullable().optional(),
  isPublic: yup.boolean().nullable().optional(),
  slug: yup
    .string()
    .trim()
    .matches(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens")
    .max(100)
    .nullable()
    .optional(),
  displayName: yup.string().trim().max(60).nullable().optional(),
});

// ─── Search Rooms ─────────────────────────────────────────────────────────────
export const searchLiveRoomsSchema = yup.object({
  q: yup.string().trim().max(100).nullable().optional(),
  status: yup.string().oneOf(STATUSES).nullable().optional(),
  courseId: yup
    .string()
    .matches(OBJECTID_REGEX, "Invalid courseId")
    .nullable()
    .optional(),
  hostUserId: yup
    .string()
    .matches(OBJECTID_REGEX, "Invalid hostUserId")
    .nullable()
    .optional(),
  isPublic: yup.boolean().nullable().optional(),
  page: yup.number().min(1).integer().optional(),
  pageSize: yup.number().min(1).max(50).integer().optional(),
});

// ─── Room Detail ──────────────────────────────────────────────────────────────
export const detailLiveRoomSchema = yup
  .object({
    roomId: yup
      .string()
      .matches(OBJECTID_REGEX, "Invalid roomId")
      .nullable()
      .optional(),
    slug: yup.string().trim().nullable().optional(),
  })
  .test("roomId-or-slug", "Either roomId or slug is required", (val) => {
    return Boolean(val.roomId || val.slug);
  });

// ─── Join Room ────────────────────────────────────────────────────────────────
export const joinLiveRoomSchema = yup.object({
  displayName: yup.string().trim().max(60).nullable().optional(),
  role: yup.string().oneOf(ROLES).nullable().optional(),
});

// ─── Send Message ─────────────────────────────────────────────────────────────
export const sendLiveMessageSchema = yup.object({
  text: yup
    .string()
    .trim()
    .required("Message text is required")
    .max(1000, "Message cannot exceed 1000 characters"),
  kind: yup.string().oneOf(MESSAGE_KINDS).nullable().optional(),
  displayName: yup.string().trim().max(60).nullable().optional(),
});

// ─── Attendance Heartbeat ─────────────────────────────────────────────────────
export const recordAttendanceSchema = yup.object({
  watchSeconds: yup.number().min(0).integer().nullable().optional(),
  isPresent: yup.boolean().nullable().optional(),
  displayName: yup.string().trim().max(60).nullable().optional(),
});

// ─── Send Reaction ────────────────────────────────────────────────────────────
export const sendLiveReactionSchema = yup.object({
  type: yup
    .string()
    .oneOf(REACTION_TYPES, "Invalid reaction type")
    .required("Reaction type is required"),
  displayName: yup.string().trim().max(60).nullable().optional(),
});

// ─── Search Messages ──────────────────────────────────────────────────────────
export const searchMessagesSchema = yup.object({
  page: yup.number().min(1).integer().optional(),
  pageSize: yup.number().min(1).max(100).integer().optional(),
});

// ─── Search Logs ──────────────────────────────────────────────────────────────
export const searchLiveRoomLogsSchema = yup.object({
  q: yup.string().trim().max(100).nullable().optional(),
  status: yup.string().oneOf(STATUSES).nullable().optional(),
  courseId: yup
    .string()
    .matches(OBJECTID_REGEX, "Invalid courseId")
    .nullable()
    .optional(),
  hostUserId: yup
    .string()
    .matches(OBJECTID_REGEX, "Invalid hostUserId")
    .nullable()
    .optional(),
  isPublic: yup.boolean().nullable().optional(),
  from: yup
    .string()
    .test("is-valid-date", "Invalid from date", (val) => {
      if (!val) return true;
      return !isNaN(Date.parse(val));
    })
    .nullable()
    .optional(),
  to: yup
    .string()
    .test("is-valid-date", "Invalid to date", (val) => {
      if (!val) return true;
      return !isNaN(Date.parse(val));
    })
    .test("to-after-from", "to must be after from", function (val) {
      const { from } = this.parent;
      if (!val || !from) return true;
      return new Date(val) > new Date(from);
    })
    .nullable()
    .optional(),
  page: yup.number().min(1).integer().optional(),
  pageSize: yup.number().min(1).max(50).integer().optional(),
});
