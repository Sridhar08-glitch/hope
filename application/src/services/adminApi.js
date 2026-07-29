const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/HoloraPerformance';

async function request(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...options.headers };
  if (method === 'GET') headers['ngrok-skip-browser-warning'] = 'true';
  const response = await fetch(url, { ...options, headers });
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('The API returned a non-JSON response. It may be unreachable.');
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Failed to parse JSON response (HTTP ${response.status})`);
  }
  if (!response.ok) {
    const msg = data?.message || data?.detail || data?.error || `HTTP ${response.status}`;
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    const inner = data.data;
    if (inner && typeof inner === 'object' && 'results' in inner) {
      if (!('next' in inner)) inner.next = inner.next_cursor ?? null;
      if (!('previous' in inner)) inner.previous = inner.prev_cursor ?? null;
    }
    return inner;
  }
  return data;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function authOnly(token) {
  return { Authorization: `Bearer ${token}` };
}

function buildUrl(path, params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return `${BASE}${path}`;
  return `${BASE}${path}?${new URLSearchParams(entries).toString()}`;
}

const get = (url, token) => request(url, { headers: authHeaders(token) });
const post = (url, token, data) => request(url, { method: 'POST', headers: authHeaders(token), body: JSON.stringify(data || {}) });
const put = (url, token, data) => request(url, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(data) });
const del = (url, token) => request(url, { method: 'DELETE', headers: authHeaders(token) });

const adminApi = {
  // ── AUTH ──────────────────────────────────────────────────
  login: (email, password) =>
    request(`${BASE}/admin/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  // ── USERS ─────────────────────────────────────────────────
  users: {
    list: (token, params = {}) => get(buildUrl('/admin/users/', params), token),
    listUrl: (token, url) => get(url, token),
    create: (token, data) => post(`${BASE}/admin/users/create/`, token, data),
    detail: (token, id) => get(`${BASE}/admin/users-detail/${id}/`, token),
    update: (token, id, data) => put(`${BASE}/admin/users-detail/${id}/`, token, data),
    delete: (token, id) => del(`${BASE}/admin/users-detail/${id}/`, token),
    bulkDelete: (token, ids) => post(`${BASE}/admin/users/bulk-delete/`, token, { user_ids: ids }),
    bulkRoleUpdate: (token, ids, role) => post(`${BASE}/admin/users/bulk-role-update/`, token, { user_ids: ids, role }),
    exportUrl: () => `${BASE}/admin/users/export/`,
    resetPassword: (token, id, newPassword) =>
      post(`${BASE}/admin/users/${id}/reset-password/`, token, newPassword ? { new_password: newPassword } : {}),
    impersonate: (token, id) => post(`${BASE}/admin/users/${id}/impersonate/`, token),
    filterOptions: (token) => get(`${BASE}/admin/users/filter-options/`, token),
    comprehensive: (token, id) => get(`${BASE}/admin/users/${id}/comprehensive/`, token),
    report: (token, id) => get(`${BASE}/admin/users/${id}/report/`, token),
  },

  // ── COMMUNITIES ───────────────────────────────────────────
  communities: {
    list: (token, params = {}) => get(buildUrl('/admin/communities/', params), token),
    listUrl: (token, url) => get(url, token),
    detail: (token, id) => get(`${BASE}/admin/communities/${id}/`, token),
    update: (token, id, data) => put(`${BASE}/admin/communities/${id}/`, token, data),
    delete: (token, id) => del(`${BASE}/admin/communities/${id}/`, token),
    members: (token, id, params = {}) => get(buildUrl(`/admin/communities/${id}/members/`, params), token),
    messages: (token, id, params = {}) => get(buildUrl(`/admin/communities/${id}/messages/`, params), token),
    joinRequests: {
      list: (token, params = {}) => get(buildUrl('/admin/community-join-requests/', params), token),
      listUrl: (token, url) => get(url, token),
      action: (token, id, data) => post(`${BASE}/admin/community-join-requests/${id}/action/`, token, data),
    },
  },

  // ── MODERATION ────────────────────────────────────────────
  moderation: {
    stats: (token) => get(`${BASE}/admin/moderation/stats/`, token),
    reports: {
      list: (token, params = {}) => get(buildUrl('/admin/reports/', params), token),
      listUrl: (token, url) => get(url, token),
      resolve: (token, id, action = 'resolve') => post(`${BASE}/admin/reports/${id}/resolve/`, token, { action }),
    },
    violations: {
      list: (token, params = {}) => get(buildUrl('/admin/message-violations/', params), token),
      listUrl: (token, url) => get(url, token),
      ignore: (token, id) => del(`${BASE}/admin/message-violations/${id}/ignore/`, token),
    },
    bans: {
      list: (token, params = {}) => get(buildUrl('/admin/community-bans/', params), token),
      listUrl: (token, url) => get(url, token),
      create: (token, data) => post(`${BASE}/admin/community-bans/create/`, token, data),
      remove: (token, id) => del(`${BASE}/admin/community-bans/${id}/remove/`, token),
    },
    mutes: {
      list: (token, params = {}) => get(buildUrl('/admin/community-mutes/', params), token),
      listUrl: (token, url) => get(url, token),
      create: (token, data) => post(`${BASE}/admin/community-mutes/create/`, token, data),
      remove: (token, id) => del(`${BASE}/admin/community-mutes/${id}/remove/`, token),
    },
    communityMessages: {
      moderate: (token, id, action) => post(`${BASE}/admin/community-messages/${id}/`, token, { action }),
      delete: (token, id) => del(`${BASE}/admin/community-messages/${id}/`, token),
    },
    privateMessages: {
      list: (token, params = {}) => get(buildUrl('/admin/private-messages/', params), token),
      listUrl: (token, url) => get(url, token),
      moderate: (token, id, action) => post(`${BASE}/admin/private-messages/${id}/`, token, { action }),
      delete: (token, id) => del(`${BASE}/admin/private-messages/${id}/`, token),
    },
    userStatus: (token, userId) => get(`${BASE}/admin/user-moderation/${userId}/`, token),
    warn: (token, userId, reason) => post(`${BASE}/admin/user-moderation/${userId}/warn/`, token, reason ? { reason } : {}),
    ban: (token, userId, days, reason) =>
      post(`${BASE}/admin/user-moderation/${userId}/ban/`, token, { ...(days ? { days } : {}), ...(reason ? { reason } : {}) }),
    unban: (token, userId) => post(`${BASE}/admin/user-moderation/${userId}/unban/`, token),
    banAppeals: {
      list: (token, params = {}) => get(buildUrl('/admin/ban-appeals/', params), token),
      listUrl: (token, url) => get(url, token),
      review: (token, id, data) => post(`${BASE}/admin/ban-appeals/${id}/review/`, token, data),
    },
    calls: {
      list: (token, params = {}) => get(buildUrl('/admin/calls/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/calls/${id}/`, token),
      stats: (token) => get(`${BASE}/admin/calls/stats/`, token),
      userHistory: (token, userId) => get(`${BASE}/admin/users/${userId}/calls/`, token),
    },
    onlineUsers: (token) => get(`${BASE}/admin/presence/online/`, token),
  },

  // ── EVENTS ────────────────────────────────────────────────
  events: {
    list: (token, params = {}) => get(buildUrl('/admin/events/', params), token),
    listUrl: (token, url) => get(url, token),
    detail: (token, id) => get(`${BASE}/admin/events/${id}/`, token),
    update: (token, id, data) => put(`${BASE}/admin/events/${id}/`, token, data),
    delete: (token, id) => del(`${BASE}/admin/events/${id}/`, token),
    approve: (token, id) => post(`${BASE}/admin/events/${id}/approve/`, token),
    reject: (token, id, reason) => post(`${BASE}/admin/events/${id}/reject/`, token, { rejection_reason: reason }),
    bulkAction: (token, ids, action, reason) =>
      post(`${BASE}/admin/events/bulk-action/`, token, { event_ids: ids, action, ...(reason ? { reason } : {}) }),
    stats: (token) => get(`${BASE}/admin/events/stats/`, token),
  },

  // ── FITNESS ───────────────────────────────────────────────
  fitness: {
    records: {
      list: (token, params = {}) => get(buildUrl('/admin/fitness/records/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/fitness/records/${id}/`, token),
      create: (token, data) => post(`${BASE}/admin/fitness/records/create/`, token, data),
      update: (token, id, data) => put(`${BASE}/admin/fitness/records/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/fitness/records/${id}/`, token),
      bulkDelete: (token, ids) => post(`${BASE}/admin/fitness/records/bulk-delete/`, token, { record_ids: ids }),
      exportUrl: () => `${BASE}/admin/fitness/records/export/`,
      bulkImport: (token, file) => {
        const form = new FormData();
        form.append('file', file);
        return request(`${BASE}/admin/fitness/records/bulk-import/`, { method: 'POST', headers: { ...authOnly(token), 'ngrok-skip-browser-warning': 'true' }, body: form });
      },
    },
    sessions: {
      list: (token, params = {}) => get(buildUrl('/admin/fitness/activity-sessions/', params), token),
      listUrl: (token, url) => get(url, token),
      delete: (token, id) => del(`${BASE}/admin/fitness/activity-sessions/${id}/delete/`, token),
    },
    stats: (token) => get(`${BASE}/admin/fitness/stats/`, token),
    userSummary: (token, userId) => get(`${BASE}/admin/fitness/users/${userId}/summary/`, token),
    filterOptions: (token) => get(`${BASE}/admin/fitness/filter-options/`, token),
  },

  // ── NUTRITION ─────────────────────────────────────────────
  nutrition: {
    dailyProgress: {
      list: (token, params = {}) => get(buildUrl('/admin/daily-progress/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/daily-progress/${id}/`, token),
      create: (token, data) => post(`${BASE}/admin/daily-progress/create/`, token, data),
      update: (token, id, data) => put(`${BASE}/admin/daily-progress/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/daily-progress/${id}/`, token),
    },
    meals: {
      list: (token, params = {}) => get(buildUrl('/admin/meals/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/meals/${id}/`, token),
      create: (token, data) => post(`${BASE}/admin/meals/create/`, token, data),
      update: (token, id, data) => put(`${BASE}/admin/meals/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/meals/${id}/`, token),
      bulkDelete: (token, ids) => post(`${BASE}/admin/meals/bulk-delete/`, token, { meal_ids: ids }),
      exportUrl: () => `${BASE}/admin/meals/export/`,
    },
    weeklyPlans: {
      list: (token, params = {}) => get(buildUrl('/admin/weekly-meal-plans/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/weekly-meal-plans/${id}/`, token),
      create: (token, data) => post(`${BASE}/admin/weekly-meal-plans/create/`, token, data),
      update: (token, id, data) => put(`${BASE}/admin/weekly-meal-plans/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/weekly-meal-plans/${id}/`, token),
      bulkDelete: (token, ids) => post(`${BASE}/admin/weekly-meal-plans/bulk-delete/`, token, { plan_ids: ids }),
    },
    stats: (token) => get(`${BASE}/admin/nutrition/stats/`, token),
    userSummary: (token, userId) => get(`${BASE}/admin/nutrition/users/${userId}/summary/`, token),
    filterOptions: (token) => get(`${BASE}/admin/nutrition/filter-options/`, token),
    cacheMetrics: (token) => get(`${BASE}/admin/nutrition/cache-metrics/`, token),
    bulkCache: (token, data) => post(`${BASE}/admin/nutrition/bulk-cache/`, token, data),
    foodLookupDebug: (token, params = {}) => get(buildUrl('/admin/nutrition/food-lookup-debug/', params), token),
  },

  // ── RECOVERY ──────────────────────────────────────────────
  recovery: {
    types: {
      list: (token, params = {}) => get(buildUrl('/admin/recovery-types/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/recovery-types/${id}/`, token),
      create: (token, data) => post(`${BASE}/admin/recovery-types/create/`, token, data),
      update: (token, id, data) => put(`${BASE}/admin/recovery-types/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/recovery-types/${id}/`, token),
      bulkAction: (token, ids, action) => post(`${BASE}/admin/recovery-types/bulk-action/`, token, { type_ids: ids, action }),
    },
    sessions: {
      list: (token, params = {}) => get(buildUrl('/admin/recovery-sessions/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/recovery-sessions/${id}/`, token),
      create: (token, data) => post(`${BASE}/admin/recovery-sessions/create/`, token, data),
      update: (token, id, data) => put(`${BASE}/admin/recovery-sessions/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/recovery-sessions/${id}/`, token),
      bulkDelete: (token, ids) => post(`${BASE}/admin/recovery-sessions/bulk-delete/`, token, { session_ids: ids }),
      exportUrl: () => `${BASE}/admin/recovery-sessions/export/`,
    },
    wellness: {
      list: (token, params = {}) => get(buildUrl('/admin/daily-wellness/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/daily-wellness/${id}/`, token),
      create: (token, data) => post(`${BASE}/admin/daily-wellness/create/`, token, data),
      update: (token, id, data) => put(`${BASE}/admin/daily-wellness/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/daily-wellness/${id}/`, token),
    },
    mobileUsage: {
      list: (token, params = {}) => get(buildUrl('/admin/mobile-usage/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/mobile-usage/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin/mobile-usage/${id}/`, token, data),
    },
    scores: {
      list: (token, params = {}) => get(buildUrl('/admin/recovery-scores/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/recovery-scores/${id}/`, token),
      recalculate: (token, id) => post(`${BASE}/admin/recovery-scores/${id}/recalculate/`, token),
    },
    stats: (token) => get(`${BASE}/admin/recovery/stats/`, token),
    userSummary: (token, userId) => get(`${BASE}/admin/recovery/users/${userId}/summary/`, token),
    filterOptions: (token) => get(`${BASE}/admin/recovery/filter-options/`, token),
  },

  // ── TRAINERS ──────────────────────────────────────────────
  trainers: {
    applications: {
      list: (token, params = {}) => get(buildUrl('/admin/trainer-applications/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/trainer-applications/${id}/`, token),
      approve: (token, id) => post(`${BASE}/admin/trainer-applications/${id}/approve/`, token),
      reject: (token, id, reason) => post(`${BASE}/admin/trainer-applications/${id}/reject/`, token, { rejection_reason: reason }),
      stats: (token) => get(`${BASE}/admin/trainer-applications/stats/`, token),
    },
    list: (token, params = {}) => get(buildUrl('/admin/trainers/', params), token),
    listUrl: (token, url) => get(url, token),
    detail: (token, id) => get(`${BASE}/admin/trainers/${id}/`, token),
    update: (token, id, data) => put(`${BASE}/admin/trainers/${id}/`, token, data),
    delete: (token, id) => del(`${BASE}/admin/trainers/${id}/`, token),
    verify: (token, id) => post(`${BASE}/admin/trainers/${id}/verify/`, token),
    unverify: (token, id) => post(`${BASE}/admin/trainers/${id}/unverify/`, token),
    feature: (token, id) => post(`${BASE}/admin/trainers/${id}/feature/`, token),
    unfeature: (token, id) => post(`${BASE}/admin/trainers/${id}/unfeature/`, token),
    activate: (token, id) => post(`${BASE}/admin/trainers/${id}/activate/`, token),
    deactivate: (token, id) => post(`${BASE}/admin/trainers/${id}/deactivate/`, token),
    bulkAction: (token, ids, action) => post(`${BASE}/admin/trainers/bulk-action/`, token, { trainer_ids: ids, action }),
    dashboardStats: (token) => get(`${BASE}/admin/trainer-dashboard/stats/`, token),
    sessionAppeals: {
      list: (token, params = {}) => get(buildUrl('/admin/session-appeals/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/session-appeals/${id}/`, token),
      approve: (token, id) => post(`${BASE}/admin/session-appeals/${id}/approve/`, token),
      refund: (token, id) => post(`${BASE}/admin/session-appeals/${id}/refund/`, token),
      reject: (token, id) => post(`${BASE}/admin/session-appeals/${id}/reject/`, token),
    },
  },

  // ── BOOKINGS ──────────────────────────────────────────────
  bookings: {
    list: (token, params = {}) => get(buildUrl('/admin/bookings/', params), token),
    listUrl: (token, url) => get(url, token),
    detail: (token, id) => get(`${BASE}/admin/bookings/${id}/`, token),
    cancel: (token, id) => post(`${BASE}/admin/bookings/${id}/cancel/`, token),
    refund: (token, id) => post(`${BASE}/admin/bookings/${id}/refund/`, token),
    stats: (token) => get(`${BASE}/admin/bookings/stats/`, token),
  },

  // ── PAYMENTS ──────────────────────────────────────────────
  payments: {
    list: (token, params = {}) => get(buildUrl('/admin/payments/', params), token),
    listUrl: (token, url) => get(url, token),
    refund: (token, id) => post(`${BASE}/admin/payments/${id}/refund/`, token),
  },

  // ── TRAINER SUBSCRIPTIONS (legacy) ────────────────────────
  subscriptions: {
    list: (token, params = {}) => get(buildUrl('/admin/subscriptions/', params), token),
    listUrl: (token, url) => get(url, token),
    cancel: (token, id) => post(`${BASE}/admin/subscriptions/${id}/cancel/`, token),
    plans: {
      list: (token) => get(`${BASE}/admin/subscription-plans/`, token),
      create: (token, data) => post(`${BASE}/admin/subscription-plans/create/`, token, data),
      update: (token, id, data) => put(`${BASE}/admin/subscription-plans/${id}/update/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/subscription-plans/${id}/delete/`, token),
    },
  },

  // ── SUBSCRIPTION MANAGEMENT (comprehensive) ──────────────
  subs: {
    plans: {
      list: (token) => get(`${BASE}/admin/subscriptions/plans/`, token),
      detail: (token, id) => get(`${BASE}/admin/subscriptions/plans/${id}/`, token),
      pricing: (token, id) => get(`${BASE}/admin/subscriptions/plans/${id}/pricing/`, token),
      updatePricing: (token, id, data) => post(`${BASE}/admin/subscriptions/plans/${id}/pricing/`, token, data),
      psychPricing: (token, id) => get(`${BASE}/admin/subscriptions/plans/${id}/psychological-pricing/`, token),
      updatePsychPricing: (token, id, data) => post(`${BASE}/admin/subscriptions/plans/${id}/psychological-pricing/`, token, data),
      audit: (token, id) => get(`${BASE}/admin/subscriptions/plans/${id}/audit/`, token),
      bulkUpdate: (token, data) => post(`${BASE}/admin/subscriptions/plans/bulk-update/`, token, data),
    },
    users: {
      list: (token, params = {}) => get(buildUrl('/admin/subscriptions/users/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/subscriptions/users/${id}/`, token),
      cancel: (token, id) => post(`${BASE}/admin/subscriptions/users/${id}/cancel/`, token),
      downgrade: (token, id, data) => post(`${BASE}/admin/subscriptions/users/${id}/downgrade/`, token, data),
      upgrade: (token, id, data) => post(`${BASE}/admin/subscriptions/users/${id}/upgrade/`, token, data),
    },
    cycles: (token, params = {}) => get(buildUrl('/admin/subscriptions/cycles/', params), token),
    analytics: (token) => get(`${BASE}/admin/subscriptions/analytics/`, token),
    referrals: {
      codes: (token, params = {}) => get(buildUrl('/admin/subscriptions/referrals/codes/', params), token),
      users: (token, params = {}) => get(buildUrl('/admin/subscriptions/referrals/users/', params), token),
      distributions: (token, params = {}) => get(buildUrl('/admin/subscriptions/referrals/distributions/', params), token),
      approveDistribution: (token, id) => post(`${BASE}/admin/subscriptions/referrals/distributions/${id}/approve/`, token),
      stats: (token) => get(`${BASE}/admin/subscriptions/referrals/stats/`, token),
    },
    coins: {
      adjustments: (token, params = {}) => get(buildUrl('/admin/subscriptions/coins/adjustments/', params), token),
      approveAdjustment: (token, id) => post(`${BASE}/admin/subscriptions/coins/adjustments/${id}/approve/`, token),
      distributionConfig: (token) => get(`${BASE}/admin/subscriptions/coins/distribution-config/`, token),
      createConfig: (token, data) => post(`${BASE}/admin/subscriptions/coins/distribution-config/`, token, data),
      updateConfig: (token, id, data) => put(`${BASE}/admin/subscriptions/coins/distribution-config/${id}/`, token, data),
      deleteConfig: (token, id) => del(`${BASE}/admin/subscriptions/coins/distribution-config/${id}/`, token),
      analytics: (token) => get(`${BASE}/admin/subscriptions/coins/analytics/`, token),
    },
    payments: {
      list: (token, params = {}) => get(buildUrl('/admin/subscriptions/payments/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/subscriptions/payments/${id}/`, token),
      analytics: (token) => get(`${BASE}/admin/subscriptions/payments/analytics/`, token),
    },
    refunds: {
      list: (token, params = {}) => get(buildUrl('/admin/subscriptions/refunds/', params), token),
      listUrl: (token, url) => get(url, token),
      approve: (token, id) => post(`${BASE}/admin/subscriptions/refunds/${id}/approve/`, token),
    },
    webhooks: {
      stripe: (token, params = {}) => get(buildUrl('/admin/subscriptions/webhooks/stripe/', params), token),
    },
    reports: {
      revenue: (token, params = {}) => get(buildUrl('/admin/subscriptions/reports/revenue/', params), token),
      churn: (token, params = {}) => get(buildUrl('/admin/subscriptions/reports/churn/', params), token),
      ltv: (token, params = {}) => get(buildUrl('/admin/subscriptions/reports/ltv/', params), token),
      coinCost: (token, params = {}) => get(buildUrl('/admin/subscriptions/reports/coin-cost/', params), token),
    },
    health: (token) => get(`${BASE}/admin/subscriptions/dashboard/health/`, token),
  },

  // ── REVIEWS ───────────────────────────────────────────────
  reviews: {
    list: (token, params = {}) => get(buildUrl('/admin/reviews/', params), token),
    listUrl: (token, url) => get(url, token),
    delete: (token, id) => del(`${BASE}/admin/reviews/${id}/delete/`, token),
  },

  // ── COUPONS ───────────────────────────────────────────────
  coupons: {
    list: (token, params = {}) => get(buildUrl('/admin/coupons/', params), token),
    listUrl: (token, url) => get(url, token),
    create: (token, data) => post(`${BASE}/admin/coupons/create/`, token, data),
    update: (token, id, data) => put(`${BASE}/admin/coupons/${id}/update/`, token, data),
    delete: (token, id) => del(`${BASE}/admin/coupons/${id}/delete/`, token),
  },

  // ── WORKOUT & MEAL PLANS ──────────────────────────────────
  workoutPlans: {
    list: (token, params = {}) => get(buildUrl('/admin/workout-plans/', params), token),
    listUrl: (token, url) => get(url, token),
    delete: (token, id) => del(`${BASE}/admin/workout-plans/${id}/delete/`, token),
  },
  trainerMealPlans: {
    list: (token, params = {}) => get(buildUrl('/admin/meal-plans/', params), token),
    listUrl: (token, url) => get(url, token),
    delete: (token, id) => del(`${BASE}/admin/meal-plans/${id}/delete/`, token),
  },

  // ── SHOP (fixed: admin-shop prefix) ───────────────────────
  shop: {
    dashboard: (token) => get(`${BASE}/admin-shop/dashboard/`, token),
    products: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/products/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin-shop/products/${id}/`, token),
      create: (token, data) => post(`${BASE}/admin-shop/products/create/`, token, data),
      update: (token, id, data) => put(`${BASE}/admin-shop/products/${id}/update/`, token, data),
      delete: (token, id) => del(`${BASE}/admin-shop/products/${id}/delete/`, token),
      restore: (token, id) => post(`${BASE}/admin-shop/products/${id}/restore/`, token),
      updateStock: (token, id, data) => put(`${BASE}/admin-shop/products/${id}/stock/`, token, data),
      duplicate: (token, id) => post(`${BASE}/admin-shop/products/${id}/duplicate/`, token),
      bulkUpdate: (token, data) => post(`${BASE}/admin-shop/products/bulk-update/`, token, data),
    },
    variants: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/variants/', params), token),
      listUrl: (token, url) => get(url, token),
      create: (token, data) => post(`${BASE}/admin-shop/variants/create/`, token, data),
      detail: (token, id) => get(`${BASE}/admin-shop/variants/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin-shop/variants/${id}/update/`, token, data),
      delete: (token, id) => del(`${BASE}/admin-shop/variants/${id}/delete/`, token),
      bulkStock: (token, data) => post(`${BASE}/admin-shop/variants/bulk-stock/`, token, data),
    },
    orders: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/orders/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin-shop/orders/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin-shop/orders/${id}/update/`, token, data),
      cancel: (token, id) => post(`${BASE}/admin-shop/orders/${id}/cancel/`, token),
      refund: (token, id) => post(`${BASE}/admin-shop/orders/${id}/refund/`, token),
      invoice: (token, id) => get(`${BASE}/admin-shop/orders/${id}/invoice/`, token),
      createManual: (token, data) => post(`${BASE}/admin-shop/orders/manual/`, token, data),
    },
    reviews: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/reviews/', params), token),
      listUrl: (token, url) => get(url, token),
      update: (token, id, data) => put(`${BASE}/admin-shop/reviews/${id}/update/`, token, data),
      delete: (token, id) => del(`${BASE}/admin-shop/reviews/${id}/delete/`, token),
      bulkApprove: (token, data) => post(`${BASE}/admin-shop/reviews/bulk-approve/`, token, data),
    },
    coupons: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/coupons/', params), token),
      listUrl: (token, url) => get(url, token),
      create: (token, data) => post(`${BASE}/admin-shop/coupons/create/`, token, data),
      detail: (token, id) => get(`${BASE}/admin-shop/coupons/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin-shop/coupons/${id}/update/`, token, data),
      delete: (token, id) => del(`${BASE}/admin-shop/coupons/${id}/delete/`, token),
      usage: (token, params = {}) => get(buildUrl('/admin-shop/coupons/usage/', params), token),
      exportUrl: () => `${BASE}/admin-shop/coupons/export/`,
    },
    shippingRules: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/shipping-rules/', params), token),
      listUrl: (token, url) => get(url, token),
      create: (token, data) => post(`${BASE}/admin-shop/shipping-rules/create/`, token, data),
      detail: (token, id) => get(`${BASE}/admin-shop/shipping-rules/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin-shop/shipping-rules/${id}/update/`, token, data),
      delete: (token, id) => del(`${BASE}/admin-shop/shipping-rules/${id}/delete/`, token),
      bulkDelete: (token, data) => post(`${BASE}/admin-shop/shipping-rules/bulk-delete/`, token, data),
    },
    taxRates: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/tax-rates/', params), token),
      create: (token, data) => post(`${BASE}/admin-shop/tax-rates/create/`, token, data),
      detail: (token, id) => get(`${BASE}/admin-shop/tax-rates/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin-shop/tax-rates/${id}/update/`, token, data),
      delete: (token, id) => del(`${BASE}/admin-shop/tax-rates/${id}/delete/`, token),
    },
    currencies: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/currencies/', params), token),
      create: (token, data) => post(`${BASE}/admin-shop/currencies/create/`, token, data),
      detail: (token, id) => get(`${BASE}/admin-shop/currencies/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin-shop/currencies/${id}/update/`, token, data),
      delete: (token, id) => del(`${BASE}/admin-shop/currencies/${id}/delete/`, token),
      setBase: (token, id) => post(`${BASE}/admin-shop/currencies/${id}/set-base/`, token),
      updateRates: (token) => post(`${BASE}/admin-shop/currencies/update-rates/`, token),
    },
    regions: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/regions/', params), token),
      create: (token, data) => post(`${BASE}/admin-shop/regions/create/`, token, data),
      detail: (token, id) => get(`${BASE}/admin-shop/regions/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin-shop/regions/${id}/update/`, token, data),
      delete: (token, id) => del(`${BASE}/admin-shop/regions/${id}/delete/`, token),
      createDefault: (token) => post(`${BASE}/admin-shop/regions/create-default/`, token),
    },
    returns: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/returns/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin-shop/returns/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin-shop/returns/${id}/update/`, token, data),
      delete: (token, id) => del(`${BASE}/admin-shop/returns/${id}/delete/`, token),
      exportUrl: () => `${BASE}/admin-shop/returns/export/`,
    },
    replacements: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/replacements/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin-shop/replacements/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin-shop/replacements/${id}/update/`, token, data),
    },
    backInStock: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/notify/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin-shop/notify/${id}/`, token),
      delete: (token, id) => del(`${BASE}/admin-shop/notify/${id}/delete/`, token),
      resend: (token, id) => post(`${BASE}/admin-shop/notify/${id}/resend/`, token),
    },
    pincodes: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/pincodes/', params), token),
      create: (token, data) => post(`${BASE}/admin-shop/pincodes/create/`, token, data),
      detail: (token, id) => get(`${BASE}/admin-shop/pincodes/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin-shop/pincodes/${id}/update/`, token, data),
      delete: (token, id) => del(`${BASE}/admin-shop/pincodes/${id}/delete/`, token),
      bulkImport: (token, file) => {
        const form = new FormData();
        form.append('file', file);
        return request(`${BASE}/admin-shop/pincodes/import/`, { method: 'POST', headers: { ...authOnly(token), 'ngrok-skip-browser-warning': 'true' }, body: form });
      },
    },
    settings: {
      list: (token) => get(`${BASE}/admin-shop/settings/`, token),
      create: (token, data) => post(`${BASE}/admin-shop/settings/create/`, token, data),
      detail: (token, key) => get(`${BASE}/admin-shop/settings/${key}/`, token),
      update: (token, key, data) => put(`${BASE}/admin-shop/settings/${key}/update/`, token, data),
      delete: (token, key) => del(`${BASE}/admin-shop/settings/${key}/delete/`, token),
    },
    wishlists: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/wishlists/', params), token),
      listUrl: (token, url) => get(url, token),
    },
    carts: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/carts/', params), token),
      listUrl: (token, url) => get(url, token),
    },
    coinTransactions: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/coin-transactions/', params), token),
      listUrl: (token, url) => get(url, token),
    },
    cartItems: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/cart-items/', params), token),
      listUrl: (token, url) => get(url, token),
    },
    orderItems: {
      list: (token, params = {}) => get(buildUrl('/admin-shop/order-items/', params), token),
      listUrl: (token, url) => get(url, token),
    },
    customers: (token, params = {}) => get(buildUrl('/admin-shop/customers/', params), token),
    exports: {
      orders: (token) => get(`${BASE}/admin-shop/export/orders/`, token),
      products: (token) => get(`${BASE}/admin-shop/export/products/`, token),
      customers: (token) => get(`${BASE}/admin-shop/export/customers/`, token),
    },
    geoBlocks: (token, params = {}) => get(buildUrl('/admin-shop/geo-blocks/', params), token),
  },

  // ── NOTIFICATIONS ─────────────────────────────────────────
  notifications: {
    list: (token, params = {}) => get(buildUrl('/admin/notifications/', params), token),
    listUrl: (token, url) => get(url, token),
    detail: (token, id) => get(`${BASE}/admin/notifications/${id}/`, token),
    delete: (token, id) => del(`${BASE}/admin/notifications/${id}/`, token),
    create: (token, data) => post(`${BASE}/admin/notifications/create/`, token, data),
    bulkSend: (token, data) => post(`${BASE}/admin/notifications/bulk-send/`, token, data),
    sendToRole: (token, data) => post(`${BASE}/admin/notifications/send-to-role/`, token, data),
    stats: (token) => get(`${BASE}/admin/notifications/stats/`, token),
    templates: (token) => get(`${BASE}/admin/notifications/templates/`, token),
  },

  // ── FINANCE ───────────────────────────────────────────────
  finance: {
    dashboard: (token) => get(`${BASE}/admin/FinanceDashboard/`, token),
    wallets: {
      list: (token, params = {}) => get(buildUrl('/admin/finance/wallets/', params), token),
      listUrl: (token, url) => get(url, token),
      detail: (token, id) => get(`${BASE}/admin/finance/wallets/${id}/`, token),
      stats: (token) => get(`${BASE}/admin/finance/wallets/stats/`, token),
      transactions: (token, params = {}) => get(buildUrl('/admin/finance/wallets/transactions/', params), token),
      transactionsUrl: (token, url) => get(url, token),
      manualReward: (token, data) => post(`${BASE}/admin/finance/wallets/manual-reward/`, token, data),
    },
  },

  // ── PRICING ENGINE ────────────────────────────────────────
  pricing: {
    germany: {
      get: (token) => get(`${BASE}/admin/pricing/germany/`, token),
      update: (token, data) => post(`${BASE}/admin/pricing/germany/`, token, data),
      preview: (token, data) => post(`${BASE}/admin/pricing/germany/preview/`, token, data),
    },
    tiers: {
      list: (token) => get(`${BASE}/admin/pricing/tiers/`, token),
      detail: (token, code) => get(`${BASE}/admin/pricing/tiers/${code}/`, token),
    },
    countries: {
      list: (token) => get(`${BASE}/admin/pricing/countries/`, token),
      detail: (token, code) => get(`${BASE}/admin/pricing/countries/${code}/`, token),
      update: (token, code, data) => put(`${BASE}/admin/pricing/countries/${code}/`, token, data),
    },
    founderPasses: {
      list: (token) => get(`${BASE}/admin/founder-passes/`, token),
      detail: (token, id) => get(`${BASE}/admin/founder-passes/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin/founder-passes/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/founder-passes/${id}/`, token),
    },
    launchDiscounts: {
      list: (token) => get(`${BASE}/admin/pricing/launch-discounts/`, token),
      detail: (token, id) => get(`${BASE}/admin/pricing/launch-discounts/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin/pricing/launch-discounts/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/pricing/launch-discounts/${id}/`, token),
    },
    campaigns: {
      list: (token) => get(`${BASE}/admin/pricing/campaigns/`, token),
      detail: (token, id) => get(`${BASE}/admin/pricing/campaigns/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin/pricing/campaigns/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/pricing/campaigns/${id}/`, token),
    },
    founderCampaigns: {
      list: (token) => get(`${BASE}/admin/pricing/founder-campaigns/`, token),
      detail: (token, id) => get(`${BASE}/admin/pricing/founder-campaigns/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin/pricing/founder-campaigns/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/pricing/founder-campaigns/${id}/`, token),
    },
    coinConfig: {
      get: (token) => get(`${BASE}/admin/coin-config/`, token),
      update: (token, data) => post(`${BASE}/admin/coin-config/`, token, data),
    },
    coinPackages: {
      list: (token) => get(`${BASE}/admin/coin-packages/`, token),
      detail: (token, id) => get(`${BASE}/admin/coin-packages/${id}/`, token),
    },
    preview: (token, data) => post(`${BASE}/admin/pricing/preview/`, token, data),
    engineStatus: (token) => get(`${BASE}/admin/pricing/engine-status/`, token),
  },

  // ── AUDIT & ANALYTICS ────────────────────────────────────
  audit: {
    logs: (token, params = {}) => get(buildUrl('/admin/audit-logs/', params), token),
    userActions: (token, params = {}) => get(buildUrl('/admin/user-actions/', params), token),
    violations: (token, params = {}) => get(buildUrl('/admin/violations/', params), token),
    dashboardStats: (token) => get(`${BASE}/admin/dashboard/stats/`, token),
  },

  // ── ADVANCED SEARCH ───────────────────────────────────────
  search: {
    users: (token, data) => post(`${BASE}/admin/search/users/`, token, data),
    trainers: (token, data) => post(`${BASE}/admin/search/trainers/`, token, data),
    applications: (token, data) => post(`${BASE}/admin/search/applications/`, token, data),
    bookings: (token, data) => post(`${BASE}/admin/search/bookings/`, token, data),
  },

  // ── FILTER PRESETS ────────────────────────────────────────
  filters: {
    options: (token) => get(`${BASE}/admin/filters/options/`, token),
    presets: {
      list: (token) => get(`${BASE}/admin/filters/presets/`, token),
      create: (token, data) => post(`${BASE}/admin/filters/presets/`, token, data),
      detail: (token, id) => get(`${BASE}/admin/filters/presets/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin/filters/presets/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/filters/presets/${id}/`, token),
      usage: (token, id) => get(`${BASE}/admin/filters/presets/${id}/usage/`, token),
    },
  },

  // ── USER SEGMENTS ─────────────────────────────────────────
  segments: {
    list: (token) => get(`${BASE}/admin/segments/`, token),
    create: (token, data) => post(`${BASE}/admin/segments/`, token, data),
    detail: (token, id) => get(`${BASE}/admin/segments/${id}/`, token),
    update: (token, id, data) => put(`${BASE}/admin/segments/${id}/`, token, data),
    delete: (token, id) => del(`${BASE}/admin/segments/${id}/`, token),
    users: (token, id, params = {}) => get(buildUrl(`/admin/segments/${id}/users/`, params), token),
  },

  // ── ALERTS ────────────────────────────────────────────────
  alerts: {
    list: (token, params = {}) => get(buildUrl('/admin/alerts/', params), token),
    action: (token, id, data) => post(`${BASE}/admin/alerts/${id}/action/`, token, data),
    check: (token) => post(`${BASE}/admin/alerts/check/`, token),
    configs: {
      list: (token) => get(`${BASE}/admin/alerts/configs/`, token),
      create: (token, data) => post(`${BASE}/admin/alerts/configs/`, token, data),
      detail: (token, id) => get(`${BASE}/admin/alerts/configs/${id}/`, token),
      update: (token, id, data) => put(`${BASE}/admin/alerts/configs/${id}/`, token, data),
      delete: (token, id) => del(`${BASE}/admin/alerts/configs/${id}/`, token),
    },
  },

  // ── APPROVALS ─────────────────────────────────────────────
  approvals: {
    list: (token, params = {}) => get(buildUrl('/admin/approvals/', params), token),
    create: (token, data) => post(`${BASE}/admin/approvals/`, token, data),
    action: (token, id, data) => post(`${BASE}/admin/approvals/${id}/action/`, token, data),
    stats: (token) => get(`${BASE}/admin/approvals/stats/`, token),
  },

  // ── BULK OPERATIONS ───────────────────────────────────────
  bulk: {
    action: (token, data) => post(`${BASE}/admin/bulk-action/`, token, data),
    history: (token, params = {}) => get(buildUrl('/admin/bulk-operations/history/', params), token),
  },

  // ── DATASETS ──────────────────────────────────────────────
  datasets: {
    foodLookups: (token, params = {}) => get(buildUrl('/admin/datasets/food-lookups/', params), token),
    exportFoodLookups: (token, data) => post(`${BASE}/admin/datasets/food-lookups/`, token, data),
    mealPhotos: (token, params = {}) => get(buildUrl('/admin/datasets/meal-photos/', params), token),
    exportMealPhotos: (token, data) => post(`${BASE}/admin/datasets/meal-photos/`, token, data),
    barcodeScans: (token, params = {}) => get(buildUrl('/admin/datasets/barcode-scans/', params), token),
    exportBarcodeScans: (token, data) => post(`${BASE}/admin/datasets/barcode-scans/`, token, data),
    voiceCommands: (token, params = {}) => get(buildUrl('/admin/datasets/voice-commands/', params), token),
    exportVoiceCommands: (token, data) => post(`${BASE}/admin/datasets/voice-commands/`, token, data),
    userNutrition: (token, params = {}) => get(buildUrl('/admin/datasets/user-nutrition/', params), token),
    exportUserNutrition: (token, data) => post(`${BASE}/admin/datasets/user-nutrition/`, token, data),
    exportLogs: (token, params = {}) => get(buildUrl('/admin/datasets/export-logs/', params), token),
    importFoods: (token, data) => post(`${BASE}/admin/import-foods/`, token, data),
  },
};

export default adminApi;
