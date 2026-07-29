/**
 * Trainer API Service
 * Handles all API calls for the trainer dashboard
 */

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/HoloraPerformance';

async function request(url, options = {}) {
  try {
    const method = (options.method || 'GET').toUpperCase();
    const headers = { ...options.headers };
    if (method === 'GET') headers['ngrok-skip-browser-warning'] = 'true';
    const response = await fetch(url, { ...options, headers });
    if (response.status === 204) return null;
    let data;
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('The API returned a non-JSON response. It may be unreachable.');
    }
    data = await response.json();
    if (!response.ok) {
      const error = new Error(data?.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    if (data?.data !== undefined) return data.data;
    return data;
  } catch (err) { throw err; }
}

function authHeaders(token) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function authOnly(token) {
  return { 'Authorization': `Bearer ${token}` };
}

function buildUrl(path, params = {}) {
  const fullPath = BASE_URL + path;
  const url = new URL(fullPath);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
}

const get = (url, token) => request(url, { headers: authHeaders(token) });
const post = (url, token, data) => request(url, { method: 'POST', headers: authHeaders(token), body: JSON.stringify(data || {}) });
const put = (url, token, data) => request(url, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(data) });
const del = (url, token) => request(url, { method: 'DELETE', headers: authHeaders(token) });

export const trainerApi = {
  // ── AUTH ──────────────────────────────────────────────────
  auth: {
    login: (email, password) =>
      request(buildUrl('/auth/login/'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }),
    logout: (token, refreshToken) =>
      post(buildUrl('/auth/logout/'), token, { refresh: refreshToken }),
    refresh: (refreshToken) =>
      request(buildUrl('/auth/refresh/'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh: refreshToken }) }),
  },

  // ── PROFILE ──────────────────────────────────────────────
  profile: {
    getMyProfile: (token) => get(buildUrl('/trainer/trainer/my-profile/'), token),
    getTrainerDetail: (token, trainerId) => get(buildUrl(`/trainer/trainers/${trainerId}/`), token),
    updateProfile: (token, data) => put(buildUrl('/trainer/trainer/my-profile/update/'), token, data),
  },

  // ── DASHBOARD ────────────────────────────────────────────
  dashboard: {
    get: (token) => get(buildUrl('/trainer/trainers/dashboard/'), token),
  },

  // ── BOOKINGS ─────────────────────────────────────────────
  bookings: {
    list: (token) => get(buildUrl('/trainer/trainer/my-bookings/'), token),
    listPending: (token) => get(buildUrl('/trainer/trainer/my-pending-bookings/'), token),
    accept: (token, bookingId) => post(buildUrl(`/trainer/trainer-bookings/${bookingId}/accept/`), token),
    reject: (token, bookingId, reason = '') =>
      post(buildUrl(`/trainer/trainer-bookings/${bookingId}/reject/`), token, { reason }),
    detail: (token, bookingId) => get(buildUrl(`/trainer/trainer-bookings/${bookingId}/`), token),
  },

  // ── CLIENTS ──────────────────────────────────────────────
  clients: {
    list: (token) => get(buildUrl('/trainer/trainer/my-clients/'), token),
    healthData: (token, clientId) => get(buildUrl(`/trainer/trainers/clients/${clientId}/health-data/`), token),
  },

  // ── AVAILABILITY ─────────────────────────────────────────
  availability: {
    list: (token) => get(buildUrl('/trainer/trainer/my-availability/'), token),
    create: (token, data) => post(buildUrl('/trainer/trainer/my-availability/'), token, data),
    delete: (token, slotId) => del(buildUrl(`/trainer/trainer/my-availability/${slotId}/`), token),
  },

  // ── BLOCKED DATES ────────────────────────────────────────
  blockedDates: {
    list: (token) => get(buildUrl('/trainer/trainer/my-blocked-dates/'), token),
    create: (token, data) => post(buildUrl('/trainer/trainer/my-blocked-dates/'), token, data),
    delete: (token, id) => del(buildUrl(`/trainer/trainer/my-blocked-dates/${id}/`), token),
  },

  // ── PLANS ────────────────────────────────────────────────
  plans: {
    list: (token) => get(buildUrl('/trainer/trainer-subscription-plans/'), token),
    create: (token, data) => post(buildUrl('/trainer/trainer-subscription-plans/'), token, data),
  },

  // ── WORKOUT PLANS ────────────────────────────────────────
  workoutPlans: {
    list: (token) => get(buildUrl('/trainer/trainer-workout-plans/'), token),
    create: (token, data) => post(buildUrl('/trainer/trainer-workout-plans/'), token, data),
  },

  // ── MEAL PLANS ───────────────────────────────────────────
  mealPlans: {
    list: (token) => get(buildUrl('/trainer/trainer-meal-plans/'), token),
    create: (token, data) => post(buildUrl('/trainer/trainer-meal-plans/'), token, data),
  },

  // ── FINANCE ──────────────────────────────────────────────
  finance: {
    invoices: (token) => get(buildUrl('/trainer/trainer-invoices/'), token),
    payments: (token) => get(buildUrl('/trainer/trainer-payments/'), token),
  },

  // ── COUPONS ──────────────────────────────────────────────
  coupons: {
    list: (token) => get(buildUrl('/trainer/trainer-coupons/'), token),
  },

  // ── VIDEO SESSIONS ───────────────────────────────────────
  videoSessions: {
    detail: (token, bookingId) => get(buildUrl(`/trainer/trainer-bookings/${bookingId}/video/`), token),
    join: (token, bookingId) => post(buildUrl(`/trainer/trainer-bookings/${bookingId}/video/join/`), token),
    end: (token, bookingId) => post(buildUrl(`/trainer/trainer-bookings/${bookingId}/video/end/`), token),
  },

  // ── SESSION FILES ────────────────────────────────────────
  sessionFiles: {
    list: (token, bookingId) => get(buildUrl(`/trainer/trainer-bookings/${bookingId}/files/`), token),
    upload: (token, bookingId, file) => {
      const form = new FormData();
      form.append('file', file);
      return request(buildUrl(`/trainer/trainer-bookings/${bookingId}/files/`), {
        method: 'POST', headers: { ...authOnly(token), 'ngrok-skip-browser-warning': 'true' }, body: form,
      });
    },
  },

  // ── SESSION APPEALS ──────────────────────────────────────
  sessionAppeals: {
    list: (token) => get(buildUrl('/trainer/trainer-session-appeals/'), token),
    create: (token, data) => post(buildUrl('/trainer/trainer-session-appeals/'), token, data),
  },

  // ── REVIEWS ──────────────────────────────────────────────
  reviews: {
    list: (token, trainerId) => get(buildUrl(`/trainer/trainers/${trainerId}/reviews/`), token),
  },

  // ── GALLERY ──────────────────────────────────────────────
  gallery: {
    list: (token, trainerId) => get(buildUrl(`/trainer/trainers/${trainerId}/gallery/`), token),
    upload: (token, trainerId, file) => {
      const form = new FormData();
      form.append('image', file);
      return request(buildUrl(`/trainer/trainers/${trainerId}/gallery/`), {
        method: 'POST', headers: { ...authOnly(token), 'ngrok-skip-browser-warning': 'true' }, body: form,
      });
    },
  },

  // ── VIDEOS ───────────────────────────────────────────────
  videos: {
    list: (token, trainerId) => get(buildUrl(`/trainer/trainers/${trainerId}/videos/`), token),
    upload: (token, trainerId, file) => {
      const form = new FormData();
      form.append('video', file);
      return request(buildUrl(`/trainer/trainers/${trainerId}/videos/`), {
        method: 'POST', headers: { ...authOnly(token), 'ngrok-skip-browser-warning': 'true' }, body: form,
      });
    },
  },

  // ── DATA CONSENT ─────────────────────────────────────────
  dataConsent: {
    list: (token) => get(buildUrl('/trainer/trainer-data-consent/'), token),
    detail: (token, trainerId) => get(buildUrl(`/trainer/trainer-data-consent/${trainerId}/`), token),
  },

  // ── APPOINTMENTS ─────────────────────────────────────────
  appointments: {
    list: (token, trainerId) => get(buildUrl(`/trainer/trainers/${trainerId}/appointments/`), token),
    create: (token, trainerId, data) => post(buildUrl(`/trainer/trainers/${trainerId}/appointments/`), token, data),
  },

  // ── NOTIFICATIONS (enhanced) ─────────────────────────────
  notifications: {
    list: (token) => get(buildUrl('/trainer/trainer/my-notifications/'), token),
    unreadCount: (token) => get(buildUrl('/notifications/unread-count/'), token),
    markRead: (token, id) => post(buildUrl(`/notifications/${id}/read/`), token),
    markAllRead: (token) => post(buildUrl('/notifications/mark-all-read/'), token),
    click: (token, id) => post(buildUrl(`/notifications/${id}/click/`), token),
    dismiss: (token, id) => del(buildUrl(`/notifications/${id}/dismiss/`), token),
    deleteAllRead: (token) => del(buildUrl('/notifications/delete-all-read/'), token),
    settings: {
      get: (token) => get(buildUrl('/settings/'), token),
      update: (token, data) => put(buildUrl('/settings/'), token, data),
    },
  },

  // ── CHAT ─────────────────────────────────────────────────
  chat: {
    communities: (token) => get(buildUrl('/chat/communities/'), token),
    communityMessages: (token, communityId, params = {}) =>
      get(buildUrl(`/chat/community/${communityId}/messages/`, params), token),
    sendCommunityMessage: (token, communityId, content) =>
      post(buildUrl(`/chat/community/${communityId}/message/`), token, { content, message_type: 'text' }),
    getRoom: (token, roomId) => get(buildUrl(`/chat/room/${roomId}/`), token),
    acceptRoom: (token, roomId) => post(buildUrl(`/chat/room/${roomId}/accept/`), token),
    rejectRoom: (token, roomId) => post(buildUrl(`/chat/room/${roomId}/reject/`), token),
    privateMessages: (token, roomId, params = {}) =>
      get(buildUrl('/chat/private/messages/', { room_id: roomId, ...params }), token),
    sendPrivateMessage: (token, roomId, content) =>
      post(buildUrl('/chat/private/message/'), token, { room_id: roomId, content, message_type: 'text' }),
  },
};

export default trainerApi;
