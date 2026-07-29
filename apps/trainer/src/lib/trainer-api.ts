"use client";

import { createApiClient, type ApiClient } from "@holora/api-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/HoloraPerformance";

/* ------------------------------------------------------------------ */
/*  Singleton client                                                   */
/* ------------------------------------------------------------------ */

let _client: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!_client) {
    _client = createApiClient({ baseUrl: API_URL });
  }
  return _client;
}

/* ------------------------------------------------------------------ */
/*  Helper: unwrap { data: ... } or { results: ... } envelopes        */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(data: any): any {
  if (data?.data !== undefined) return data.data;
  return data;
}

// Build a query string ("?a=1&b=2") from a params object, skipping empty values.
function qs(params?: Record<string, string | number | undefined>): string {
  if (!params) return "";
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return pairs.length ? `?${pairs.join("&")}` : "";
}

/* ------------------------------------------------------------------ */
/*  Typed endpoint functions — every one accepts `api: ApiClient`      */
/*  so the caller can pass the auth-wired client from useAuth().       */
/* ------------------------------------------------------------------ */

export const trainerApi = {
  // ── AUTH ────────────────────────────────────────────────────────────
  auth: {
    login: (api: ApiClient, email: string, password: string) =>
      api.post<unknown>("/auth/login/", { email, password }).then(unwrap),
    logout: (api: ApiClient, refreshToken: string) =>
      api.post<unknown>("/auth/logout/", { refresh: refreshToken }),
    refresh: (api: ApiClient, refreshToken: string) =>
      api.post<unknown>("/auth/refresh/", { refresh: refreshToken }).then(unwrap),
  },

  // ── PROFILE ────────────────────────────────────────────────────────
  profile: {
    getMyProfile: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/my-profile/").then(unwrap),
    getTrainerDetail: (api: ApiClient, trainerId: string | number) =>
      api.get<unknown>(`/trainer/trainers/${trainerId}/`).then(unwrap),
    updateProfile: (api: ApiClient, data: Record<string, unknown>) =>
      api.put<unknown>("/trainer/trainer/my-profile/update/", data).then(unwrap),
  },

  // ── DASHBOARD ──────────────────────────────────────────────────────
  dashboard: {
    get: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainers/dashboard/").then(unwrap),
  },

  // ── BOOKINGS ───────────────────────────────────────────────────────
  bookings: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/my-bookings/").then(unwrap),
    listPending: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/my-pending-bookings/").then(unwrap),
    accept: (api: ApiClient, bookingId: string | number) =>
      api.post<unknown>(`/trainer/trainer-bookings/${bookingId}/accept/`).then(unwrap),
    reject: (api: ApiClient, bookingId: string | number, reason = "") =>
      api.post<unknown>(`/trainer/trainer-bookings/${bookingId}/reject/`, { reason }).then(unwrap),
    detail: (api: ApiClient, bookingId: string | number) =>
      api.get<unknown>(`/trainer/trainer-bookings/${bookingId}/`).then(unwrap),
  },

  // ── CLIENTS ────────────────────────────────────────────────────────
  clients: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/my-clients/").then(unwrap),
    healthData: (api: ApiClient, clientId: string | number) =>
      api.get<unknown>(`/trainer/trainers/clients/${clientId}/health-data/`).then(unwrap),
  },

  // ── AVAILABILITY ───────────────────────────────────────────────────
  availability: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/my-availability/").then(unwrap),
    create: (api: ApiClient, data: Record<string, unknown>) =>
      api.post<unknown>("/trainer/trainer/my-availability/", data).then(unwrap),
    delete: (api: ApiClient, slotId: string | number) =>
      api.del<unknown>(`/trainer/trainer/my-availability/${slotId}/`),
  },

  // ── BLOCKED DATES ──────────────────────────────────────────────────
  blockedDates: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/my-blocked-dates/").then(unwrap),
    create: (api: ApiClient, data: Record<string, unknown>) =>
      api.post<unknown>("/trainer/trainer/my-blocked-dates/", data).then(unwrap),
    delete: (api: ApiClient, id: string | number) =>
      api.del<unknown>(`/trainer/trainer/my-blocked-dates/${id}/`),
  },

  // ── PLANS (subscription plans are read-only — managed by admin) ──
  plans: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer-subscription-plans/").then(unwrap),
  },

  // ── WORKOUT PLANS (requires: title, trainer, client) ──────────────
  workoutPlans: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer-workout-plans/").then(unwrap),
    create: (api: ApiClient, data: Record<string, unknown>) =>
      api.post<unknown>("/trainer/trainer-workout-plans/", data).then(unwrap),
  },

  // ── MEAL PLANS (requires: title, trainer, client) ────────────────
  mealPlans: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer-meal-plans/").then(unwrap),
    create: (api: ApiClient, data: Record<string, unknown>) =>
      api.post<unknown>("/trainer/trainer-meal-plans/", data).then(unwrap),
  },

  // ── FINANCE ────────────────────────────────────────────────────────
  finance: {
    invoices: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer-invoices/").then(unwrap),
    payments: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer-payments/").then(unwrap),
  },

  // ── EARNINGS & PAYOUTS ─────────────────────────────────────────────
  // NOTE: these endpoints return `{ success, ...keys }` with NO `data`
  // key, so the api-client interceptor does not unwrap them and `unwrap()`
  // is a no-op — the full object (payload keys at top level) is returned.
  // Money fields are raw decimals; currency is always a sibling string.
  earnings: {
    // GET → { success, balances[], lifetime, by_status[], by_source_type[],
    //         recent_entries[], payout_requests_summary[], commission_override_pct }
    dashboard: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/my-earnings-dashboard/").then(unwrap),
    // GET → { success, balances[], has_pending_request }
    payoutBalance: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/my-payout-balance/").then(unwrap),
    // GET → { success, currencies[], any_eligible }
    payoutEligibility: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/my-payout-eligibility/").then(unwrap),
    // GET (PageNumberPagination) → { count, next, previous, results[] }
    payoutRequests: (api: ApiClient, page = 1) =>
      api.get<unknown>(`/trainer/trainer/my-payout-requests/?page=${page}`).then(unwrap),
    // GET → { success, payout_request: { ...request, entries[] } }
    payoutRequestDetail: (api: ApiClient, id: number) =>
      api.get<unknown>(`/trainer/trainer/my-payout-requests/${id}/`).then(unwrap),
    // POST → 201 { success, payout_request, payout_requests[] }. Body only
    // takes an optional `note`; the server claims the entire available balance.
    createPayoutRequest: (api: ApiClient, note = "") =>
      api.post<unknown>("/trainer/trainer/my-payout-requests/", { note }).then(unwrap),
    // GET → { success, statement } (optional ?year&month or ?start&end)
    financialStatement: (api: ApiClient, params?: Record<string, string | number>) =>
      api.get<unknown>(`/trainer/trainer/my-financial-statement/${qs(params)}`).then(unwrap),
    // GET (PageNumberPagination) → { count, next, previous, results[] }
    disputes: (api: ApiClient, page = 1) =>
      api.get<unknown>(`/trainer/trainer/my-disputes/?page=${page}`).then(unwrap),
    // GET → { success, analytics } (optional ?months)
    analytics: (api: ApiClient, months?: number) =>
      api.get<unknown>(`/trainer/trainer/my-analytics/${months ? `?months=${months}` : ""}`).then(unwrap),
  },

  // ── STRIPE CONNECT ─────────────────────────────────────────────────
  connect: {
    // GET → { success, has_connect_account, charges_enabled, payouts_enabled,
    //         details_submitted, onboarded_at, requirements }
    status: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/connect/status/").then(unwrap),
    // POST (both urls required) → { success, onboarding_url }
    onboardingLink: (api: ApiClient, refreshUrl: string, returnUrl: string) =>
      api
        .post<unknown>("/trainer/trainer/connect/onboarding-link/", {
          refresh_url: refreshUrl,
          return_url: returnUrl,
        })
        .then(unwrap),
  },

  // ── COUPONS ────────────────────────────────────────────────────────
  coupons: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer-coupons/").then(unwrap),
  },

  // ── NOTIFICATIONS ──────────────────────────────────────────────────
  notifications: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/my-notifications/").then(unwrap),
    // Trainer notifications are integer-keyed and served by dedicated routes
    // under /trainer/trainer/my-notifications/ (NOT the generic UUID-keyed
    // /notifications/ endpoints, which 404 for trainer notification ids).
    unreadCount: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/my-notifications/unread-count/").then(unwrap),
    markRead: (api: ApiClient, id: string | number) =>
      api.post<unknown>(`/trainer/trainer/my-notifications/${id}/mark-read/`).then(unwrap),
    markAllRead: (api: ApiClient) =>
      api.post<unknown>("/trainer/trainer/my-notifications/mark-all-read/").then(unwrap),
    click: (api: ApiClient, id: string | number) =>
      api.post<unknown>(`/notifications/${id}/click/`).then(unwrap),
    dismiss: (api: ApiClient, id: string | number) =>
      api.del<unknown>(`/notifications/${id}/dismiss/`),
    deleteAllRead: (api: ApiClient) =>
      api.del<unknown>("/notifications/delete-all-read/"),
    settings: {
      get: (api: ApiClient) =>
        api.get<unknown>("/settings/").then(unwrap),
      update: (api: ApiClient, data: Record<string, unknown>) =>
        api.put<unknown>("/settings/", data).then(unwrap),
    },
  },

  // ── CHAT ───────────────────────────────────────────────────────────
  chat: {
    // Communities
    communities: (api: ApiClient) =>
      api.get<unknown>("/chat/communities/").then(unwrap),
    getCommunity: (api: ApiClient, communityId: string | number) =>
      api.get<unknown>(`/chat/communities/${communityId}/`).then(unwrap),
    communityMessages: (api: ApiClient, communityId: string | number, params?: Record<string, string>) =>
      api.get<unknown>(`/chat/communities/${communityId}/messages/`, params).then(unwrap),
    sendCommunityMessage: (api: ApiClient, communityId: string | number, content: string, messageType = "text") =>
      api.post<unknown>(`/chat/communities/${communityId}/messages/send/`, { content, message_type: messageType }).then(unwrap),
    reactToCommunityMessage: (api: ApiClient, communityId: string | number, messageId: string, emoji: string) =>
      api.post<unknown>(`/chat/communities/${communityId}/messages/${messageId}/react/`, { emoji }).then(unwrap),
    replyCommunityMessage: (api: ApiClient, communityId: string | number, messageId: string, content: string) =>
      api.post<unknown>(`/chat/communities/${communityId}/messages/${messageId}/reply/`, { content, message_type: "text" }).then(unwrap),
    editCommunityMessage: (api: ApiClient, communityId: string | number, messageId: string, content: string) =>
      api.patch<unknown>(`/chat/communities/${communityId}/messages/${messageId}/edit/`, { content }).then(unwrap),
    deleteCommunityMessage: (api: ApiClient, communityId: string | number, messageId: string) =>
      api.del<unknown>(`/chat/communities/${communityId}/messages/${messageId}/delete/`),
    restoreCommunityMessage: (api: ApiClient, communityId: string | number, messageId: string) =>
      api.post<unknown>(`/chat/communities/${communityId}/messages/${messageId}/restore/`).then(unwrap),
    pinCommunityMessage: (api: ApiClient, communityId: string | number, messageId: string) =>
      api.post<unknown>(`/chat/communities/${communityId}/messages/${messageId}/pin/`).then(unwrap),
    starCommunityMessage: (api: ApiClient, communityId: string | number, messageId: string) =>
      api.post<unknown>(`/chat/communities/${communityId}/messages/${messageId}/star/`).then(unwrap),
    getCommunityThread: (api: ApiClient, communityId: string | number, messageId: string) =>
      api.get<unknown>(`/chat/communities/${communityId}/messages/${messageId}/thread/`).then(unwrap),
    getCommunityReactions: (api: ApiClient, communityId: string | number, messageId: string) =>
      api.get<unknown>(`/chat/communities/${communityId}/messages/${messageId}/reactions/`).then(unwrap),
    getCommunityMembers: (api: ApiClient, communityId: string | number) =>
      api.get<unknown>(`/chat/communities/${communityId}/members/`).then(unwrap),
    getPinnedCommunityMessages: (api: ApiClient, communityId: string | number) =>
      api.get<unknown>(`/chat/communities/${communityId}/pinned/`).then(unwrap),
    forwardCommunityMessage: (api: ApiClient, communityId: string | number, messageId: string, data: Record<string, unknown>) =>
      api.post<unknown>(`/chat/communities/${communityId}/messages/${messageId}/forward/`, data).then(unwrap),

    // Private chat rooms (no list endpoint — rooms discovered via WebSocket or community member interactions)
    getRoom: (api: ApiClient, roomId: string | number) =>
      api.get<unknown>(`/chat/private-chat/${roomId}/`).then(unwrap),
    acceptRoom: (api: ApiClient, roomId: string | number) =>
      api.post<unknown>(`/chat/private-chat/${roomId}/accept/`).then(unwrap),
    rejectRoom: (api: ApiClient, roomId: string | number) =>
      api.post<unknown>(`/chat/private-chat/${roomId}/reject/`).then(unwrap),
    archiveRoom: (api: ApiClient, roomId: string | number) =>
      api.post<unknown>(`/chat/private-chat/${roomId}/archive/`).then(unwrap),
    muteRoom: (api: ApiClient, roomId: string | number, data?: Record<string, unknown>) =>
      api.post<unknown>(`/chat/private-chat/${roomId}/mute/`, data).then(unwrap),
    clearRoom: (api: ApiClient, roomId: string | number) =>
      api.post<unknown>(`/chat/private-chat/${roomId}/clear/`).then(unwrap),
    blockUser: (api: ApiClient, roomId: string | number) =>
      api.post<unknown>(`/chat/private-chat/${roomId}/block/`).then(unwrap),
    deleteRoom: (api: ApiClient, roomId: string | number) =>
      api.del<unknown>(`/chat/private-chat/${roomId}/delete/`),
    getPinnedPrivateMessages: (api: ApiClient, roomId: string | number) =>
      api.get<unknown>(`/chat/private-chat/${roomId}/pinned/`).then(unwrap),

    // Private messages
    privateMessages: (api: ApiClient, roomId: string | number, params?: Record<string, string>) =>
      api.get<unknown>("/chat/private-messages/", { room_id: String(roomId), ...params }).then(unwrap),
    sendPrivateMessage: (api: ApiClient, roomId: string | number, content: string, messageType = "text", replyToId?: string) =>
      api.post<unknown>("/chat/private-messages/send/", { room_id: roomId, content, message_type: messageType, ...(replyToId ? { reply_to_id: replyToId } : {}) }).then(unwrap),
    reactToPrivateMessage: (api: ApiClient, messageId: string, emoji: string) =>
      api.post<unknown>(`/chat/private-messages/${messageId}/react/`, { emoji }).then(unwrap),
    replyToPrivateMessage: (api: ApiClient, messageId: string, content: string) =>
      api.post<unknown>(`/chat/private-messages/${messageId}/reply/`, { content, message_type: "text" }).then(unwrap),
    editPrivateMessage: (api: ApiClient, messageId: string, content: string) =>
      api.patch<unknown>(`/chat/private-messages/${messageId}/edit/`, { content }).then(unwrap),
    deletePrivateMessage: (api: ApiClient, messageId: string, deleteType = "for_me") =>
      api.del<unknown>(`/chat/private-messages/${messageId}/delete/?delete_type=${deleteType}`),
    restorePrivateMessage: (api: ApiClient, messageId: string) =>
      api.post<unknown>(`/chat/private-messages/${messageId}/restore/`).then(unwrap),
    forwardPrivateMessage: (api: ApiClient, messageId: string, data: Record<string, unknown>) =>
      api.post<unknown>(`/chat/private-messages/${messageId}/forward/`, data).then(unwrap),
    pinPrivateMessage: (api: ApiClient, messageId: string) =>
      api.post<unknown>(`/chat/private-messages/${messageId}/pin/`).then(unwrap),
    starPrivateMessage: (api: ApiClient, messageId: string) =>
      api.post<unknown>(`/chat/private-messages/${messageId}/star/`).then(unwrap),
    markDelivered: (api: ApiClient, messageId: string) =>
      api.post<unknown>(`/chat/private-messages/${messageId}/delivered/`).then(unwrap),
    markMessageRead: (api: ApiClient, messageId: string) =>
      api.post<unknown>(`/chat/private-messages/${messageId}/read/`).then(unwrap),
    getPrivateReactions: (api: ApiClient, messageId: string) =>
      api.get<unknown>(`/chat/private-messages/${messageId}/reactions/`).then(unwrap),
    getStarredMessages: (api: ApiClient) =>
      api.get<unknown>("/chat/private-messages/starred/").then(unwrap),
    searchPrivateMessages: (api: ApiClient, params?: Record<string, string>) =>
      api.get<unknown>("/chat/private-messages/search/", params).then(unwrap),
    bulkPrivateAction: (api: ApiClient, data: Record<string, unknown>) =>
      api.post<unknown>("/chat/private-messages/bulk-action/", data).then(unwrap),
    uploadVoiceNote: (api: ApiClient, file: File) => {
      const form = new FormData();
      form.append("voice_note", file);
      return api.postFormData<unknown>("/chat/private-messages/voice-note/", form).then(unwrap);
    },

    // Sidebar (lists all chats — communities + private)
    getSidebar: (api: ApiClient) =>
      api.get<unknown>("/chat/sidebar/").then(unwrap),
    getArchivedChats: (api: ApiClient) =>
      api.get<unknown>("/chat/sidebar/archived/").then(unwrap),

    // Unified search
    searchMessages: (api: ApiClient, params?: Record<string, string>) =>
      api.get<unknown>("/chat/messages/search/", params).then(unwrap),

    // Presence
    getPresence: (api: ApiClient, userId: string | number) =>
      api.get<unknown>(`/chat/presence/${userId}/`).then(unwrap),

    // Calls
    canCall: (api: ApiClient, userId: string | number) =>
      api.get<unknown>(`/chat/can-call/${userId}/`).then(unwrap),
    getCallHistory: (api: ApiClient, params?: Record<string, string>) =>
      api.get<unknown>("/chat/calls/", params).then(unwrap),
    getCallDetail: (api: ApiClient, callId: string) =>
      api.get<unknown>(`/chat/calls/${callId}/`).then(unwrap),
    getTurnCredentials: (api: ApiClient) =>
      api.get<unknown>("/chat/turn-credentials/").then(unwrap),
  },

  // ── REVIEWS ────────────────────────────────────────────────────────
  reviews: {
    list: (api: ApiClient, trainerId: string | number) =>
      api.get<unknown>(`/trainer/trainers/${trainerId}/reviews/`).then(unwrap),
  },

  // ── GALLERY ────────────────────────────────────────────────────────
  gallery: {
    list: (api: ApiClient, trainerId: string | number) =>
      api.get<unknown>(`/trainer/trainers/${trainerId}/gallery/`).then(unwrap),
    upload: (api: ApiClient, trainerId: string | number, file: File) => {
      const form = new FormData();
      form.append("image", file);
      return api.postFormData<unknown>(`/trainer/trainers/${trainerId}/gallery/`, form).then(unwrap);
    },
  },

  // ── VIDEOS ─────────────────────────────────────────────────────────
  videos: {
    list: (api: ApiClient, trainerId: string | number) =>
      api.get<unknown>(`/trainer/trainers/${trainerId}/videos/`).then(unwrap),
    upload: (api: ApiClient, trainerId: string | number, file: File) => {
      const form = new FormData();
      form.append("video", file);
      return api.postFormData<unknown>(`/trainer/trainers/${trainerId}/videos/`, form).then(unwrap);
    },
  },

  // ── DATA CONSENT ───────────────────────────────────────────────────
  dataConsent: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer-data-consent/").then(unwrap),
    detail: (api: ApiClient, trainerId: string | number) =>
      api.get<unknown>(`/trainer/trainer-data-consent/${trainerId}/`).then(unwrap),
  },

  // ── APPOINTMENTS ───────────────────────────────────────────────────
  appointments: {
    list: (api: ApiClient, trainerId: string | number) =>
      api.get<unknown>(`/trainer/trainers/${trainerId}/appointments/`).then(unwrap),
    create: (api: ApiClient, trainerId: string | number, data: Record<string, unknown>) =>
      api.post<unknown>(`/trainer/trainers/${trainerId}/appointments/`, data).then(unwrap),
  },

  // ── SESSION FILES ──────────────────────────────────────────────────
  sessionFiles: {
    list: (api: ApiClient, bookingId: string | number) =>
      api.get<unknown>(`/trainer/trainer-bookings/${bookingId}/files/`).then(unwrap),
    upload: (api: ApiClient, bookingId: string | number, file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.postFormData<unknown>(`/trainer/trainer-bookings/${bookingId}/files/`, form).then(unwrap);
    },
  },

  // ── SESSION APPEALS ────────────────────────────────────────────────
  sessionAppeals: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer-session-appeals/").then(unwrap),
    create: (api: ApiClient, data: Record<string, unknown>) =>
      api.post<unknown>("/trainer/trainer-session-appeals/", data).then(unwrap),
  },

  // ── SUBSCRIPTIONS (alias for plans) ────────────────────────────────
  subscriptions: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer-subscription-plans/").then(unwrap),
  },

  // ── STUDIO (Video Management) ─────────────────────────────────────
  studio: {
    // Upload
    getUploadUrl: (api: ApiClient, data: { title: string; filename: string; content_type: string; file_size?: number }) =>
      api.post<unknown>("/studio/videos/upload-url/", data).then(unwrap),

    // CRUD
    listMine: (api: ApiClient, params?: Record<string, string>) =>
      api.get<unknown>("/studio/videos/mine/", params).then(unwrap),
    getVideo: (api: ApiClient, videoId: string) =>
      api.get<unknown>(`/studio/videos/${videoId}/`).then(unwrap),
    getStreamUrl: (api: ApiClient, videoId: string) =>
      api.get<unknown>(`/studio/videos/${videoId}/stream-url/`).then(unwrap),
    updateVideo: (api: ApiClient, videoId: string, data: Record<string, unknown>) =>
      api.patch<unknown>(`/studio/videos/${videoId}/`, data).then(unwrap),
    deleteVideo: (api: ApiClient, videoId: string) =>
      api.del<unknown>(`/studio/videos/${videoId}/`),

    // Processing & Status
    processVideo: (api: ApiClient, videoId: string) =>
      api.post<unknown>(`/studio/videos/${videoId}/process/`).then(unwrap),
    getStatus: (api: ApiClient, videoId: string) =>
      api.get<unknown>(`/studio/videos/${videoId}/status/`).then(unwrap),
    // Music-rights declaration for a video parked in `awaiting_music_confirmation`.
    // `declaration` is one of "own_voice" | "has_rights" | "unsure"; `details` is
    // required by the backend when declaration === "has_rights".
    musicConfirmation: (api: ApiClient, videoId: string, data: { declaration: string; details?: string }) =>
      api.post<unknown>(`/studio/videos/${videoId}/music-confirmation/`, data).then(unwrap),

    // Lifecycle transitions
    moveToDraft: (api: ApiClient, videoId: string) =>
      api.post<unknown>(`/studio/videos/${videoId}/draft/`).then(unwrap),
    scheduleVideo: (api: ApiClient, videoId: string, data: { scheduled_at: string }) =>
      api.post<unknown>(`/studio/videos/${videoId}/schedule/`, data).then(unwrap),
    updateSchedule: (api: ApiClient, videoId: string, data: { scheduled_at: string }) =>
      api.patch<unknown>(`/studio/videos/${videoId}/schedule/`, data).then(unwrap),
    cancelSchedule: (api: ApiClient, videoId: string) =>
      api.del<unknown>(`/studio/videos/${videoId}/schedule/`),
    archiveVideo: (api: ApiClient, videoId: string) =>
      api.post<unknown>(`/studio/videos/${videoId}/archive/`).then(unwrap),
    restoreVideo: (api: ApiClient, videoId: string) =>
      api.post<unknown>(`/studio/videos/${videoId}/restore/`).then(unwrap),
    duplicateVideo: (api: ApiClient, videoId: string) =>
      api.post<unknown>(`/studio/videos/${videoId}/duplicate/`).then(unwrap),

    // Thumbnail
    uploadThumbnail: (api: ApiClient, videoId: string, file: File) => {
      const form = new FormData();
      form.append("thumbnail", file);
      return api.postFormData<unknown>(`/studio/videos/${videoId}/thumbnail/`, form).then(unwrap);
    },

    // Chapters
    listChapters: (api: ApiClient, videoId: string) =>
      api.get<unknown>(`/studio/videos/${videoId}/chapters/`).then(unwrap),
    createChapter: (api: ApiClient, videoId: string, data: Record<string, unknown>) =>
      api.post<unknown>(`/studio/videos/${videoId}/chapters/`, data).then(unwrap),
    updateChapter: (api: ApiClient, videoId: string, chapterId: number, data: Record<string, unknown>) =>
      api.patch<unknown>(`/studio/videos/${videoId}/chapters/${chapterId}/`, data).then(unwrap),
    deleteChapter: (api: ApiClient, videoId: string, chapterId: number) =>
      api.del<unknown>(`/studio/videos/${videoId}/chapters/${chapterId}/`),
    reorderChapters: (api: ApiClient, videoId: string, order: number[]) =>
      api.post<unknown>(`/studio/videos/${videoId}/chapters/reorder/`, { order }).then(unwrap),

    // Comments
    listComments: (api: ApiClient, videoId: string, params?: Record<string, string>) =>
      api.get<unknown>(`/studio/videos/${videoId}/comments/`, params).then(unwrap),
    deleteComment: (api: ApiClient, videoId: string, commentId: number) =>
      api.del<unknown>(`/studio/videos/${videoId}/comments/${commentId}/`),
    pinComment: (api: ApiClient, videoId: string, commentId: number) =>
      api.post<unknown>(`/studio/videos/${videoId}/comments/${commentId}/pin/`).then(unwrap),
    unpinComment: (api: ApiClient, videoId: string, commentId: number) =>
      api.del<unknown>(`/studio/videos/${videoId}/comments/${commentId}/pin/`),

    // Bulk actions
    bulkArchive: (api: ApiClient, videoIds: string[]) =>
      api.post<unknown>("/studio/videos/bulk-archive/", { video_ids: videoIds }).then(unwrap),
    bulkDelete: (api: ApiClient, videoIds: string[]) =>
      api.post<unknown>("/studio/videos/bulk-delete/", { video_ids: videoIds }).then(unwrap),
    bulkAccessType: (api: ApiClient, videoIds: string[], contentType: string) =>
      api.post<unknown>("/studio/videos/bulk-access-type/", { video_ids: videoIds, content_type: contentType }).then(unwrap),
  },

  // ── STUDIO MUSIC (Epidemic Sound) ─────────────────────────────────
  studioMusic: {
    search: (api: ApiClient, params?: Record<string, string>) =>
      api.get<unknown>("/studio/music/search/", params).then(unwrap),
    preview: (api: ApiClient, trackId: string) =>
      api.get<unknown>(`/studio/music/preview/${trackId}/`).then(unwrap),
    listTracks: (api: ApiClient, videoId: string) =>
      api.get<unknown>(`/studio/videos/${videoId}/music/`).then(unwrap),
    attachTrack: (api: ApiClient, videoId: string, data: Record<string, unknown>) =>
      api.post<unknown>(`/studio/videos/${videoId}/music/`, data).then(unwrap),
    updateTrack: (api: ApiClient, videoId: string, trackPk: number, data: Record<string, unknown>) =>
      api.patch<unknown>(`/studio/videos/${videoId}/music/${trackPk}/`, data).then(unwrap),
    deleteTrack: (api: ApiClient, videoId: string, trackPk: number) =>
      api.del<unknown>(`/studio/videos/${videoId}/music/${trackPk}/`),
    reorderTracks: (api: ApiClient, videoId: string, tracks: { id: number; order: number }[]) =>
      api.post<unknown>(`/studio/videos/${videoId}/music/reorder/`, { tracks }).then(unwrap),
    reprocess: (api: ApiClient, videoId: string) =>
      api.post<unknown>(`/studio/videos/${videoId}/music/reprocess/`).then(unwrap),
  },

  // ── STUDIO DASHBOARD ─────────────────────────────────────────────
  studioDashboard: {
    get: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/studio/dashboard/").then(unwrap),
  },

  // ── VIDEO ANALYTICS ──────────────────────────────────────────────
  videoAnalytics: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/analytics/videos/").then(unwrap),
    daily: (api: ApiClient, videoId: string, params?: Record<string, string>) =>
      api.get<unknown>(`/trainer/trainer/analytics/videos/${videoId}/daily/`, params).then(unwrap),
    funnel: (api: ApiClient, videoId: string) =>
      api.get<unknown>(`/trainer/trainer/analytics/videos/${videoId}/funnel/`).then(unwrap),
    watchEvents: (api: ApiClient, params?: Record<string, string>) =>
      api.get<unknown>("/trainer/trainer/analytics/watch-events/", params).then(unwrap),
    exportCsv: (api: ApiClient, params?: Record<string, string>) =>
      api.get<unknown>("/trainer/trainer/analytics/export/", params),
    bestPostingTime: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/analytics/best-posting-time/").then(unwrap),
  },

  // ── PROGRAMS ─────────────────────────────────────────────────────
  trainerPrograms: {
    list: (api: ApiClient) =>
      api.get<unknown>("/trainer/trainer/programs/").then(unwrap),
    create: (api: ApiClient, data: Record<string, unknown>) =>
      api.post<unknown>("/trainer/trainer/programs/", data).then(unwrap),
    get: (api: ApiClient, programId: number) =>
      api.get<unknown>(`/trainer/trainer/programs/${programId}/`).then(unwrap),
    update: (api: ApiClient, programId: number, data: Record<string, unknown>) =>
      api.patch<unknown>(`/trainer/trainer/programs/${programId}/`, data).then(unwrap),
    delete: (api: ApiClient, programId: number) =>
      api.del<unknown>(`/trainer/trainer/programs/${programId}/`),
    publish: (api: ApiClient, programId: number) =>
      api.post<unknown>(`/trainer/trainer/programs/${programId}/publish/`).then(unwrap),
    unpublish: (api: ApiClient, programId: number) =>
      api.post<unknown>(`/trainer/trainer/programs/${programId}/unpublish/`).then(unwrap),
    duplicate: (api: ApiClient, programId: number) =>
      api.post<unknown>(`/trainer/trainer/programs/${programId}/duplicate/`).then(unwrap),

    // Days
    listDays: (api: ApiClient, programId: number) =>
      api.get<unknown>(`/trainer/trainer/programs/${programId}/days/`).then(unwrap),
    createDay: (api: ApiClient, programId: number, data: Record<string, unknown>) =>
      api.post<unknown>(`/trainer/trainer/programs/${programId}/days/`, data).then(unwrap),
    getDay: (api: ApiClient, programId: number, dayNumber: number) =>
      api.get<unknown>(`/trainer/trainer/programs/${programId}/days/${dayNumber}/`).then(unwrap),
    updateDay: (api: ApiClient, programId: number, dayNumber: number, data: Record<string, unknown>) =>
      api.patch<unknown>(`/trainer/trainer/programs/${programId}/days/${dayNumber}/`, data).then(unwrap),
    deleteDay: (api: ApiClient, programId: number, dayNumber: number) =>
      api.del<unknown>(`/trainer/trainer/programs/${programId}/days/${dayNumber}/`),

    // Day Videos
    addVideoToDay: (api: ApiClient, programId: number, dayNumber: number, data: Record<string, unknown>) =>
      api.post<unknown>(`/trainer/trainer/programs/${programId}/days/${dayNumber}/videos/`, data).then(unwrap),
    removeVideoFromDay: (api: ApiClient, programId: number, dayNumber: number, videoId: number) =>
      api.del<unknown>(`/trainer/trainer/programs/${programId}/days/${dayNumber}/videos/${videoId}/`),
    reorderDayVideos: (api: ApiClient, programId: number, dayNumber: number, order: number[]) =>
      api.patch<unknown>(`/trainer/trainer/programs/${programId}/days/${dayNumber}/videos/reorder/`, { order }).then(unwrap),
  },

  // ── COACHING PACKAGES (sellable offerings) ─────────────────────────
  // Paginated DRF lists ({count,next,previous,results}); create/detail return
  // the bare serializer object. No DELETE — retire via PATCH { is_active:false }.
  coachingPackages: {
    list: (api: ApiClient, page = 1) =>
      api.get<unknown>(`/trainer/trainer/my-coaching-packages/?page=${page}`).then(unwrap),
    create: (api: ApiClient, data: Record<string, unknown>) =>
      api.post<unknown>("/trainer/trainer/my-coaching-packages/", data).then(unwrap),
    detail: (api: ApiClient, id: number) =>
      api.get<unknown>(`/trainer/trainer/my-coaching-packages/${id}/`).then(unwrap),
    update: (api: ApiClient, id: number, data: Record<string, unknown>) =>
      api.patch<unknown>(`/trainer/trainer/my-coaching-packages/${id}/`, data).then(unwrap),
  },

  // ── COACHING PLANS (per-client multi-week coaching) ────────────────
  // Distinct from `trainerPrograms` (reusable video programs). Plans are
  // assigned to a specific client with a start date + duration.
  coachingPlans: {
    list: (api: ApiClient, page = 1) =>
      api.get<unknown>(`/trainer/trainer-coaching-plans/?page=${page}`).then(unwrap),
    // POST body: { client (int, required), title, start_date, duration_weeks, booking? }
    create: (api: ApiClient, data: Record<string, unknown>) =>
      api.post<unknown>("/trainer/trainer-coaching-plans/", data).then(unwrap),
    // GET returns the calendar serializer: plan fields + nested `days[]`.
    detail: (api: ApiClient, id: number) =>
      api.get<unknown>(`/trainer/trainer-coaching-plans/${id}/`).then(unwrap),
    // PATCH: only `title` and `status` are writable (status ∈ active/paused/completed/cancelled).
    update: (api: ApiClient, id: number, data: Record<string, unknown>) =>
      api.patch<unknown>(`/trainer/trainer-coaching-plans/${id}/`, data).then(unwrap),
    progress: (api: ApiClient, id: number) =>
      api.get<unknown>(`/trainer/trainer-coaching-plans/${id}/progress/`).then(unwrap),
    today: (api: ApiClient, id: number) =>
      api.get<unknown>(`/trainer/trainer-coaching-plans/${id}/today/`).then(unwrap),
    nextUnscheduledDay: (api: ApiClient, id: number) =>
      api.get<unknown>(`/trainer/trainer-coaching-plans/${id}/next-unscheduled-day/`).then(unwrap),
    // POST body: { booking_id (int, required) } — extends via a paid training_plan booking.
    extend: (api: ApiClient, id: number, bookingId: number) =>
      api.post<unknown>(`/trainer/trainer-coaching-plans/${id}/extend/`, { booking_id: bookingId }).then(unwrap),
    // Days under a plan.
    listDays: (api: ApiClient, planId: number, page = 1) =>
      api.get<unknown>(`/trainer/trainer-coaching-plans/${planId}/days/?page=${page}`).then(unwrap),
    // POST body: { day_number (required), day_type?, workout_plan?, workout_plan_day_number?, trainer_note? }
    createDay: (api: ApiClient, planId: number, data: Record<string, unknown>) =>
      api.post<unknown>(`/trainer/trainer-coaching-plans/${planId}/days/`, data).then(unwrap),
  },

  // ── COACHING DAYS (day-level edits, meals, videos) ─────────────────
  coachingDays: {
    detail: (api: ApiClient, dayId: number) =>
      api.get<unknown>(`/trainer/trainer-coaching-days/${dayId}/`).then(unwrap),
    update: (api: ApiClient, dayId: number, data: Record<string, unknown>) =>
      api.patch<unknown>(`/trainer/trainer-coaching-days/${dayId}/`, data).then(unwrap),
    delete: (api: ApiClient, dayId: number) =>
      api.del<unknown>(`/trainer/trainer-coaching-days/${dayId}/`),
    // Meal recommendations on a day.
    listMeals: (api: ApiClient, dayId: number, page = 1) =>
      api.get<unknown>(`/trainer/trainer-coaching-days/${dayId}/meals/?page=${page}`).then(unwrap),
    // POST body: { meal_type (required), recipe? (int), note? } — recipe and note not both empty.
    addMeal: (api: ApiClient, dayId: number, data: Record<string, unknown>) =>
      api.post<unknown>(`/trainer/trainer-coaching-days/${dayId}/meals/`, data).then(unwrap),
    // Meal item edit/delete lives at a top-level path (not nested under the day).
    deleteMeal: (api: ApiClient, mealId: number) =>
      api.del<unknown>(`/trainer/trainer-coaching-meals/${mealId}/`),
    // Studio video attach/detach — video_id is a UUID string. No GET (read via
    // the day's `studio_videos_detail`). DELETE takes the id in the body.
    attachVideo: (api: ApiClient, dayId: number, videoId: string) =>
      api.post<unknown>(`/trainer/trainer-coaching-days/${dayId}/videos/`, { video_id: videoId }).then(unwrap),
    detachVideo: (api: ApiClient, dayId: number, videoId: string) =>
      api.instance
        .delete(`/trainer/trainer-coaching-days/${dayId}/videos/`, { data: { video_id: videoId } })
        .then((r) => r.data),
  },

  // ── CLIENT GOALS (view goals + suggest / withdraw) ─────────────────
  // GET goals returns { success, data:[...] } (auto-unwrapped → array).
  // A trainer cannot create a Goal directly — only suggest one.
  clientGoals: {
    list: (api: ApiClient, clientId: number, status?: string) =>
      api.get<unknown>(`/trainer/clients/${clientId}/goals/${status ? `?status=${status}` : ""}`).then(unwrap),
    // POST body via GoalSuggestionCreateSerializer (goal_type + title required; other
    // fields depend on goal_type). Returns { success, data:{suggestion} } (unwrapped).
    suggest: (api: ApiClient, clientId: number, data: Record<string, unknown>) =>
      api.post<unknown>(`/trainer/clients/${clientId}/goal-suggestions/`, data).then(unwrap),
    // GET list of THIS trainer's suggestions — DRF paginated ({count,...,results}).
    suggestions: (api: ApiClient, status?: string, page = 1) =>
      api.get<unknown>(`/trainer/goal-suggestions/?page=${page}${status ? `&status=${status}` : ""}`).then(unwrap),
    withdrawSuggestion: (api: ApiClient, suggestionId: number) =>
      api.post<unknown>(`/trainer/goal-suggestions/${suggestionId}/withdraw/`).then(unwrap),
  },
};
