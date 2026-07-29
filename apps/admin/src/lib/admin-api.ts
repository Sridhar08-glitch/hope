/**
 * Admin API service — migrated from application/src/services/adminApi.js
 * Uses ApiClient from @holora/api-client for authenticated requests.
 */
import type { ApiClient } from "@holora/api-client";

type Params = Record<string, string>;

function qs(params: Params = {}): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export function createAdminApi(api: ApiClient) {
  const g = <T = unknown>(path: string, params?: Params) =>
    api.get<T>(`${path}${qs(params)}`);
  const p = <T = unknown>(path: string, data?: unknown) =>
    api.post<T>(path, data);
  const u = <T = unknown>(path: string, data?: unknown) =>
    api.put<T>(path, data);
  const pt = <T = unknown>(path: string, data?: unknown) =>
    api.patch<T>(path, data);
  const d = <T = unknown>(path: string) => api.del<T>(path);

  return {
    // ── DASHBOARD ─────────────────────────────────────────
    dashboard: {
      stats: () => g("/admin/dashboard/stats/"),
    },

    // ── USERS ─────────────────────────────────────────────
    users: {
      list: (params?: Params) => g("/admin/users/", params),
      create: (data: unknown) => p("/admin/users/create/", data),
      detail: (id: string) => g(`/admin/users-detail/${id}/`),
      update: (id: string, data: unknown) => u(`/admin/users-detail/${id}/`, data),
      delete: (id: string) => d(`/admin/users-detail/${id}/`),
      bulkDelete: (ids: string[]) => p("/admin/users/bulk-delete/", { user_ids: ids }),
      bulkRoleUpdate: (ids: string[], role: string) => p("/admin/users/bulk-role-update/", { user_ids: ids, role }),
      resetPassword: (id: string, newPassword?: string) => p(`/admin/users/${id}/reset-password/`, newPassword ? { new_password: newPassword } : {}),
      impersonate: (id: string) => p(`/admin/users/${id}/impersonate/`),
      filterOptions: () => g("/admin/users/filter-options/"),
      comprehensive: (id: string) => g(`/admin/users/${id}/comprehensive/`),
      report: (id: string) => g(`/admin/users/${id}/report/`),
    },

    // ── COMMUNITIES ───────────────────────────────────────
    communities: {
      list: (params?: Params) => g("/admin/communities/", params),
      detail: (id: string) => g(`/admin/communities/${id}/`),
      update: (id: string, data: unknown) => u(`/admin/communities/${id}/`, data),
      delete: (id: string) => d(`/admin/communities/${id}/`),
      members: (id: string, params?: Params) => g(`/admin/communities/${id}/members/`, params),
      messages: (id: string, params?: Params) => g(`/admin/communities/${id}/messages/`, params),
      joinRequests: {
        list: (params?: Params) => g("/admin/community-join-requests/", params),
        action: (id: string, data: unknown) => p(`/admin/community-join-requests/${id}/action/`, data),
      },
    },

    // ── MODERATION ────────────────────────────────────────
    moderation: {
      stats: () => g("/admin/moderation/stats/"),
      reports: {
        list: (params?: Params) => g("/admin/reports/", params),
        resolve: (id: string, action = "resolve") => p(`/admin/reports/${id}/resolve/`, { action }),
      },
      violations: {
        list: (params?: Params) => g("/admin/message-violations/", params),
        ignore: (id: string) => d(`/admin/message-violations/${id}/ignore/`),
      },
      bans: {
        list: (params?: Params) => g("/admin/community-bans/", params),
        create: (data: unknown) => p("/admin/community-bans/create/", data),
        remove: (id: string) => d(`/admin/community-bans/${id}/remove/`),
      },
      mutes: {
        list: (params?: Params) => g("/admin/community-mutes/", params),
        create: (data: unknown) => p("/admin/community-mutes/create/", data),
        remove: (id: string) => d(`/admin/community-mutes/${id}/remove/`),
      },
      communityMessages: {
        moderate: (id: string, action: string) => p(`/admin/community-messages/${id}/`, { action }),
        delete: (id: string) => d(`/admin/community-messages/${id}/`),
      },
      privateMessages: {
        list: (params?: Params) => g("/admin/private-messages/", params),
        moderate: (id: string, action: string) => p(`/admin/private-messages/${id}/`, { action }),
        delete: (id: string) => d(`/admin/private-messages/${id}/`),
      },
      userStatus: (userId: string) => g(`/admin/user-moderation/${userId}/`),
      warn: (userId: string, reason?: string) => p(`/admin/user-moderation/${userId}/warn/`, reason ? { reason } : {}),
      ban: (userId: string, days?: number, reason?: string) => p(`/admin/user-moderation/${userId}/ban/`, { ...(days ? { days } : {}), ...(reason ? { reason } : {}) }),
      unban: (userId: string) => p(`/admin/user-moderation/${userId}/unban/`),
      banAppeals: {
        list: (params?: Params) => g("/admin/ban-appeals/", params),
        review: (id: string, data: unknown) => p(`/admin/ban-appeals/${id}/review/`, data),
      },
      calls: {
        list: (params?: Params) => g("/admin/calls/", params),
        detail: (id: string) => g(`/admin/calls/${id}/`),
        stats: () => g("/admin/calls/stats/"),
        userHistory: (userId: string) => g(`/admin/users/${userId}/calls/`),
      },
      onlineUsers: () => g("/admin/presence/online/"),
    },

    // ── EVENTS ────────────────────────────────────────────
    events: {
      list: (params?: Params) => g("/admin/events/", params),
      detail: (id: string) => g(`/admin/events/${id}/`),
      update: (id: string, data: unknown) => u(`/admin/events/${id}/`, data),
      delete: (id: string) => d(`/admin/events/${id}/`),
      approve: (id: string) => p(`/admin/events/${id}/approve/`),
      reject: (id: string, reason: string) => p(`/admin/events/${id}/reject/`, { rejection_reason: reason }),
      bulkAction: (ids: string[], action: string, reason?: string) => p("/admin/events/bulk-action/", { event_ids: ids, action, ...(reason ? { reason } : {}) }),
      stats: () => g("/admin/events/stats/"),
    },

    // ── FITNESS ───────────────────────────────────────────
    fitness: {
      records: {
        list: (params?: Params) => g("/admin/fitness/records/", params),
        detail: (id: string) => g(`/admin/fitness/records/${id}/`),
        create: (data: unknown) => p("/admin/fitness/records/create/", data),
        update: (id: string, data: unknown) => u(`/admin/fitness/records/${id}/`, data),
        delete: (id: string) => d(`/admin/fitness/records/${id}/`),
        bulkDelete: (ids: string[]) => p("/admin/fitness/records/bulk-delete/", { record_ids: ids }),
      },
      sessions: {
        list: (params?: Params) => g("/admin/fitness/activity-sessions/", params),
        delete: (id: string) => d(`/admin/fitness/activity-sessions/${id}/delete/`),
      },
      stats: () => g("/admin/fitness/stats/"),
      userSummary: (userId: string) => g(`/admin/fitness/users/${userId}/summary/`),
      filterOptions: () => g("/admin/fitness/filter-options/"),
    },

    // ── NUTRITION ─────────────────────────────────────────
    nutrition: {
      dailyProgress: {
        list: (params?: Params) => g("/admin/daily-progress/", params),
        detail: (id: string) => g(`/admin/daily-progress/${id}/`),
        create: (data: unknown) => p("/admin/daily-progress/create/", data),
        update: (id: string, data: unknown) => u(`/admin/daily-progress/${id}/`, data),
        delete: (id: string) => d(`/admin/daily-progress/${id}/`),
      },
      meals: {
        list: (params?: Params) => g("/admin/meals/", params),
        detail: (id: string) => g(`/admin/meals/${id}/`),
        create: (data: unknown) => p("/admin/meals/create/", data),
        update: (id: string, data: unknown) => u(`/admin/meals/${id}/`, data),
        delete: (id: string) => d(`/admin/meals/${id}/`),
        bulkDelete: (ids: string[]) => p("/admin/meals/bulk-delete/", { meal_ids: ids }),
      },
      weeklyPlans: {
        list: (params?: Params) => g("/admin/weekly-meal-plans/", params),
        detail: (id: string) => g(`/admin/weekly-meal-plans/${id}/`),
        create: (data: unknown) => p("/admin/weekly-meal-plans/create/", data),
        update: (id: string, data: unknown) => u(`/admin/weekly-meal-plans/${id}/`, data),
        delete: (id: string) => d(`/admin/weekly-meal-plans/${id}/`),
        bulkDelete: (ids: string[]) => p("/admin/weekly-meal-plans/bulk-delete/", { plan_ids: ids }),
      },
      stats: () => g("/admin/nutrition/stats/"),
      userSummary: (userId: string) => g(`/admin/nutrition/users/${userId}/summary/`),
      filterOptions: () => g("/admin/nutrition/filter-options/"),
      cacheMetrics: () => g("/admin/nutrition/cache-metrics/"),
    },

    // ── RECOVERY ──────────────────────────────────────────
    recovery: {
      types: {
        list: (params?: Params) => g("/admin/recovery-types/", params),
        detail: (id: string) => g(`/admin/recovery-types/${id}/`),
        create: (data: unknown) => p("/admin/recovery-types/create/", data),
        update: (id: string, data: unknown) => u(`/admin/recovery-types/${id}/`, data),
        delete: (id: string) => d(`/admin/recovery-types/${id}/`),
        bulkAction: (ids: string[], action: string) => p("/admin/recovery-types/bulk-action/", { type_ids: ids, action }),
      },
      sessions: {
        list: (params?: Params) => g("/admin/recovery-sessions/", params),
        detail: (id: string) => g(`/admin/recovery-sessions/${id}/`),
        create: (data: unknown) => p("/admin/recovery-sessions/create/", data),
        update: (id: string, data: unknown) => u(`/admin/recovery-sessions/${id}/`, data),
        delete: (id: string) => d(`/admin/recovery-sessions/${id}/`),
        bulkDelete: (ids: string[]) => p("/admin/recovery-sessions/bulk-delete/", { session_ids: ids }),
      },
      wellness: {
        list: (params?: Params) => g("/admin/daily-wellness/", params),
        detail: (id: string) => g(`/admin/daily-wellness/${id}/`),
        create: (data: unknown) => p("/admin/daily-wellness/create/", data),
        update: (id: string, data: unknown) => u(`/admin/daily-wellness/${id}/`, data),
        delete: (id: string) => d(`/admin/daily-wellness/${id}/`),
      },
      mobileUsage: {
        list: (params?: Params) => g("/admin/mobile-usage/", params),
        detail: (id: string) => g(`/admin/mobile-usage/${id}/`),
        update: (id: string, data: unknown) => u(`/admin/mobile-usage/${id}/`, data),
      },
      scores: {
        list: (params?: Params) => g("/admin/recovery-scores/", params),
        detail: (id: string) => g(`/admin/recovery-scores/${id}/`),
        recalculate: (id: string) => p(`/admin/recovery-scores/${id}/recalculate/`),
      },
      stats: () => g("/admin/recovery/stats/"),
      userSummary: (userId: string) => g(`/admin/recovery/users/${userId}/summary/`),
      filterOptions: () => g("/admin/recovery/filter-options/"),
    },

    // ── TRAINERS ──────────────────────────────────────────
    trainers: {
      applications: {
        list: (params?: Params) => g("/admin/trainer-applications/", params),
        detail: (id: string) => g(`/admin/trainer-applications/${id}/`),
        approve: (id: string) => p(`/admin/trainer-applications/${id}/approve/`),
        reject: (id: string, reason: string) => p(`/admin/trainer-applications/${id}/reject/`, { rejection_reason: reason }),
        stats: () => g("/admin/trainer-applications/stats/"),
      },
      list: (params?: Params) => g("/admin/trainers/", params),
      detail: (id: string) => g(`/admin/trainers/${id}/`),
      update: (id: string, data: unknown) => u(`/admin/trainers/${id}/`, data),
      delete: (id: string) => d(`/admin/trainers/${id}/`),
      verify: (id: string) => p(`/admin/trainers/${id}/verify/`),
      unverify: (id: string) => p(`/admin/trainers/${id}/unverify/`),
      feature: (id: string) => p(`/admin/trainers/${id}/feature/`),
      unfeature: (id: string) => p(`/admin/trainers/${id}/unfeature/`),
      activate: (id: string) => p(`/admin/trainers/${id}/activate/`),
      deactivate: (id: string) => p(`/admin/trainers/${id}/deactivate/`),
      bulkAction: (ids: string[], action: string) => p("/admin/trainers/bulk-action/", { trainer_ids: ids, action }),
      dashboardStats: () => g("/admin/trainer-dashboard/stats/"),
      sessionAppeals: {
        list: (params?: Params) => g("/admin/session-appeals/", params),
        detail: (id: string) => g(`/admin/session-appeals/${id}/`),
        approve: (id: string) => p(`/admin/session-appeals/${id}/approve/`),
        refund: (id: string) => p(`/admin/session-appeals/${id}/refund/`),
        reject: (id: string) => p(`/admin/session-appeals/${id}/reject/`),
      },
    },

    // ── BOOKINGS ──────────────────────────────────────────
    bookings: {
      list: (params?: Params) => g("/admin/bookings/", params),
      detail: (id: string) => g(`/admin/bookings/${id}/`),
      cancel: (id: string) => p(`/admin/bookings/${id}/cancel/`),
      refund: (id: string) => p(`/admin/bookings/${id}/refund/`),
      stats: () => g("/admin/bookings/stats/"),
    },

    // ── PAYMENTS ──────────────────────────────────────────
    payments: {
      list: (params?: Params) => g("/admin/payments/", params),
      refund: (id: string) => p(`/admin/payments/${id}/refund/`),
    },

    // ── SUBSCRIPTIONS ─────────────────────────────────────
    subs: {
      plans: {
        list: () => g("/admin/subscriptions/plans/"),
        detail: (id: string) => g(`/admin/subscriptions/plans/${id}/`),
        pricing: (id: string) => g(`/admin/subscriptions/plans/${id}/pricing/`),
        updatePricing: (id: string, data: unknown) => p(`/admin/subscriptions/plans/${id}/pricing/`, data),
        audit: (id: string) => g(`/admin/subscriptions/plans/${id}/audit/`),
        bulkUpdate: (data: unknown) => p("/admin/subscriptions/plans/bulk-update/", data),
      },
      users: {
        list: (params?: Params) => g("/admin/subscriptions/users/", params),
        detail: (id: string) => g(`/admin/subscriptions/users/${id}/`),
        cancel: (id: string) => p(`/admin/subscriptions/users/${id}/cancel/`),
        downgrade: (id: string, data: unknown) => p(`/admin/subscriptions/users/${id}/downgrade/`, data),
        upgrade: (id: string, data: unknown) => p(`/admin/subscriptions/users/${id}/upgrade/`, data),
      },
      cycles: (params?: Params) => g("/admin/subscriptions/cycles/", params),
      analytics: () => g("/admin/subscriptions/analytics/"),
      referrals: {
        codes: (params?: Params) => g("/admin/subscriptions/referrals/codes/", params),
        users: (params?: Params) => g("/admin/subscriptions/referrals/users/", params),
        distributions: (params?: Params) => g("/admin/subscriptions/referrals/distributions/", params),
        approveDistribution: (id: string) => p(`/admin/subscriptions/referrals/distributions/${id}/approve/`),
        stats: () => g("/admin/subscriptions/referrals/stats/"),
      },
      coins: {
        adjustments: (params?: Params) => g("/admin/subscriptions/coins/adjustments/", params),
        approveAdjustment: (id: string) => p(`/admin/subscriptions/coins/adjustments/${id}/approve/`),
        distributionConfig: () => g("/admin/subscriptions/coins/distribution-config/"),
        analytics: () => g("/admin/subscriptions/coins/analytics/"),
      },
      payments: {
        list: (params?: Params) => g("/admin/subscriptions/payments/", params),
        detail: (id: string) => g(`/admin/subscriptions/payments/${id}/`),
        analytics: () => g("/admin/subscriptions/payments/analytics/"),
      },
      refunds: {
        list: (params?: Params) => g("/admin/subscriptions/refunds/", params),
        approve: (id: string) => p(`/admin/subscriptions/refunds/${id}/approve/`),
      },
      reports: {
        revenue: (params?: Params) => g("/admin/subscriptions/reports/revenue/", params),
        churn: (params?: Params) => g("/admin/subscriptions/reports/churn/", params),
        ltv: (params?: Params) => g("/admin/subscriptions/reports/ltv/", params),
      },
      health: () => g("/admin/subscriptions/dashboard/health/"),
    },

    // ── SHOP ──────────────────────────────────────────────
    shop: {
      dashboard: () => g("/admin-shop/dashboard/"),
      products: {
        list: (params?: Params) => g("/admin-shop/products/", params),
        detail: (id: string) => g(`/admin-shop/products/${id}/`),
        create: (data: unknown) => p("/admin-shop/products/create/", data),
        update: (id: string, data: unknown) => u(`/admin-shop/products/${id}/update/`, data),
        delete: (id: string) => d(`/admin-shop/products/${id}/delete/`),
        updateStock: (id: string, data: unknown) => u(`/admin-shop/products/${id}/stock/`, data),
        duplicate: (id: string) => p(`/admin-shop/products/${id}/duplicate/`),
        bulkUpdate: (data: unknown) => p("/admin-shop/products/bulk-update/", data),
      },
      orders: {
        list: (params?: Params) => g("/admin-shop/orders/", params),
        detail: (id: string) => g(`/admin-shop/orders/${id}/`),
        update: (id: string, data: unknown) => u(`/admin-shop/orders/${id}/update/`, data),
        cancel: (id: string) => p(`/admin-shop/orders/${id}/cancel/`),
        refund: (id: string) => p(`/admin-shop/orders/${id}/refund/`),
        invoice: (id: string) => g(`/admin-shop/orders/${id}/invoice/`),
      },
      reviews: {
        list: (params?: Params) => g("/admin-shop/reviews/", params),
        update: (id: string, data: unknown) => u(`/admin-shop/reviews/${id}/update/`, data),
        delete: (id: string) => d(`/admin-shop/reviews/${id}/delete/`),
        bulkApprove: (data: unknown) => p("/admin-shop/reviews/bulk-approve/", data),
      },
      coupons: {
        list: (params?: Params) => g("/admin-shop/coupons/", params),
        create: (data: unknown) => p("/admin-shop/coupons/create/", data),
        detail: (id: string) => g(`/admin-shop/coupons/${id}/`),
        update: (id: string, data: unknown) => u(`/admin-shop/coupons/${id}/update/`, data),
        delete: (id: string) => d(`/admin-shop/coupons/${id}/delete/`),
      },
      returns: {
        list: (params?: Params) => g("/admin-shop/returns/", params),
        detail: (id: string) => g(`/admin-shop/returns/${id}/`),
        update: (id: string, data: unknown) => u(`/admin-shop/returns/${id}/update/`, data),
      },
      // ── Store configuration (raw DRF: bare array lists, no pagination) ──
      // Each list returns a plain array; create/update return the bare object;
      // delete returns 204. `/create/`, `/update/`, `/delete/` aliases used.
      currencies: {
        list: () => g<unknown[]>("/admin-shop/currencies/"),
        create: (data: unknown) => p("/admin-shop/currencies/create/", data),
        update: (id: number | string, data: unknown) => u(`/admin-shop/currencies/${id}/update/`, data),
        delete: (id: number | string) => d(`/admin-shop/currencies/${id}/delete/`),
        setBase: (id: number | string) => p(`/admin-shop/currencies/${id}/set-base/`), // envelope
        updateRates: () => p("/admin-shop/currencies/update-rates/"), // envelope
      },
      taxRates: {
        list: () => g<unknown[]>("/admin-shop/tax-rates/"),
        create: (data: unknown) => p("/admin-shop/tax-rates/create/", data),
        update: (id: number | string, data: unknown) => u(`/admin-shop/tax-rates/${id}/update/`, data),
        delete: (id: number | string) => d(`/admin-shop/tax-rates/${id}/delete/`),
      },
      shippingRules: {
        list: () => g<unknown[]>("/admin-shop/shipping-rules/"),
        create: (data: unknown) => p("/admin-shop/shipping-rules/create/", data),
        update: (id: number | string, data: unknown) => u(`/admin-shop/shipping-rules/${id}/update/`, data),
        delete: (id: number | string) => d(`/admin-shop/shipping-rules/${id}/delete/`),
        bulkDelete: (ids: number[]) => api.instance.delete("/admin-shop/shipping-rules/bulk-delete/", { data: { ids } }).then((r) => r.data),
      },
      regions: {
        list: () => g<unknown[]>("/admin-shop/regions/"),
        create: (data: unknown) => p("/admin-shop/regions/create/", data),
        update: (id: number | string, data: unknown) => u(`/admin-shop/regions/${id}/update/`, data),
        delete: (id: number | string) => d(`/admin-shop/regions/${id}/delete/`),
        createDefault: () => p("/admin-shop/regions/create-default/"), // envelope
      },
      pincodes: {
        list: (params?: Params) => g<unknown[]>("/admin-shop/pincodes/", params), // ?city=&state= (bare array)
        create: (data: unknown) => p("/admin-shop/pincodes/create/", data),
        update: (id: number | string, data: unknown) => u(`/admin-shop/pincodes/${id}/update/`, data),
        delete: (id: number | string) => d(`/admin-shop/pincodes/${id}/delete/`),
        import: (formData: FormData) => api.postFormData("/admin-shop/pincodes/import/", formData), // envelope
      },
      variants: {
        // NOTE: create is unusable server-side (serializer omits required `product`
        // FK). Expose list + edit-existing + bulk-stock only.
        list: (params?: Params) => g<unknown[]>("/admin-shop/variants/", params), // ?product_id=
        update: (id: number | string, data: unknown) => u(`/admin-shop/variants/${id}/update/`, data),
        delete: (id: number | string) => d(`/admin-shop/variants/${id}/delete/`),
        bulkStock: (updates: unknown[]) => p("/admin-shop/variants/bulk-stock/", { updates }), // envelope
      },
      // Store settings: flat key/value table. Only list + create work reliably
      // (detail/update-by-key 500s on the backend), so no edit path exposed.
      storeSettings: {
        list: () => g<unknown[]>("/admin-shop/settings/"),
        create: (data: unknown) => p("/admin-shop/settings/create/", data),
      },
      // ── Operational (DRF paginated) ──
      notify: {
        list: (params?: Params) => g("/admin-shop/notify/", params),
        delete: (id: number | string) => d(`/admin-shop/notify/${id}/delete/`),
        resend: (id: number | string) => p(`/admin-shop/notify/${id}/resend/`), // envelope
      },
      replacements: {
        list: (params?: Params) => g("/admin-shop/replacements/", params),
        detail: (id: number | string) => g(`/admin-shop/replacements/${id}/`),
        update: (id: number | string, data: unknown) => u(`/admin-shop/replacements/${id}/update/`, data),
      },
      customers: {
        list: (params?: Params) => g("/admin-shop/customers/", params), // ?search=
      },
      geoBlocks: {
        list: (params?: Params) => g("/admin-shop/geo-blocks/", params), // ?country=&reason=
      },
      // File downloads — build a URL and fetch as a blob (do NOT JSON-parse).
      exportUrl: {
        orders: (params?: Params) => `/admin-shop/export/orders/${qs(params)}`,
        products: (params?: Params) => `/admin-shop/export/products/${qs(params)}`,
        customers: (params?: Params) => `/admin-shop/export/customers/${qs(params)}`,
      },
    },

    // ── NOTIFICATIONS ─────────────────────────────────────
    notifications: {
      list: (params?: Params) => g("/admin/notifications/", params),
      detail: (id: string) => g(`/admin/notifications/${id}/`),
      delete: (id: string) => d(`/admin/notifications/${id}/`),
      create: (data: unknown) => p("/admin/notifications/create/", data),
      bulkSend: (data: unknown) => p("/admin/notifications/bulk-send/", data),
      sendToRole: (data: unknown) => p("/admin/notifications/send-to-role/", data),
      stats: () => g("/admin/notifications/stats/"),
      templates: () => g("/admin/notifications/templates/"),
    },

    // ── FINANCE ───────────────────────────────────────────
    finance: {
      dashboard: () => g("/admin/FinanceDashboard/"),
      wallets: {
        list: (params?: Params) => g("/admin/finance/wallets/", params),
        detail: (id: string) => g(`/admin/finance/wallets/${id}/`),
        stats: () => g("/admin/finance/wallets/stats/"),
        transactions: (params?: Params) => g("/admin/finance/wallets/transactions/", params),
        manualReward: (data: unknown) => p("/admin/finance/wallets/manual-reward/", data),
      },
    },

    // ── PRICING ENGINE ────────────────────────────────────
    pricing: {
      germany: {
        get: () => g("/admin/pricing/germany/"),
        update: (data: unknown) => p("/admin/pricing/germany/", data),
        preview: (data: unknown) => p("/admin/pricing/germany/preview/", data),
      },
      tiers: {
        list: () => g("/admin/pricing/tiers/"),
        detail: (code: string) => g(`/admin/pricing/tiers/${code}/`),
      },
      countries: {
        list: () => g("/admin/pricing/countries/"),
        detail: (code: string) => g(`/admin/pricing/countries/${code}/`),
        update: (code: string, data: unknown) => u(`/admin/pricing/countries/${code}/`, data),
      },
      founderPasses: {
        list: () => g("/admin/founder-passes/"),
        detail: (id: string) => g(`/admin/founder-passes/${id}/`),
        update: (id: string, data: unknown) => u(`/admin/founder-passes/${id}/`, data),
        delete: (id: string) => d(`/admin/founder-passes/${id}/`),
      },
      engineStatus: () => g("/admin/pricing/engine-status/"),
    },

    // ── AUDIT ─────────────────────────────────────────────
    audit: {
      logs: (params?: Params) => g("/admin/audit-logs/", params),
      userActions: (params?: Params) => g("/admin/user-actions/", params),
      violations: (params?: Params) => g("/admin/violations/", params),
    },

    // ── SEARCH ────────────────────────────────────────────
    search: {
      users: (data: unknown) => p("/admin/search/users/", data),
      trainers: (data: unknown) => p("/admin/search/trainers/", data),
      applications: (data: unknown) => p("/admin/search/applications/", data),
      bookings: (data: unknown) => p("/admin/search/bookings/", data),
    },

    // ── SEGMENTS ──────────────────────────────────────────
    segments: {
      list: () => g("/admin/segments/"),
      create: (data: unknown) => p("/admin/segments/", data),
      detail: (id: string) => g(`/admin/segments/${id}/`),
      update: (id: string, data: unknown) => u(`/admin/segments/${id}/`, data),
      delete: (id: string) => d(`/admin/segments/${id}/`),
      users: (id: string, params?: Params) => g(`/admin/segments/${id}/users/`, params),
    },

    // ── ALERTS ────────────────────────────────────────────
    alerts: {
      list: (params?: Params) => g("/admin/alerts/", params),
      action: (id: string, data: unknown) => p(`/admin/alerts/${id}/action/`, data),
      check: () => p("/admin/alerts/check/"),
      configs: {
        list: () => g("/admin/alerts/configs/"),
        create: (data: unknown) => p("/admin/alerts/configs/", data),
        detail: (id: string) => g(`/admin/alerts/configs/${id}/`),
        update: (id: string, data: unknown) => u(`/admin/alerts/configs/${id}/`, data),
        delete: (id: string) => d(`/admin/alerts/configs/${id}/`),
      },
    },

    // ── APPROVALS ─────────────────────────────────────────
    approvals: {
      list: (params?: Params) => g("/admin/approvals/", params),
      create: (data: unknown) => p("/admin/approvals/", data),
      action: (id: string, data: unknown) => p(`/admin/approvals/${id}/action/`, data),
      stats: () => g("/admin/approvals/stats/"),
    },

    // ── DATASETS ──────────────────────────────────────────
    datasets: {
      foodLookups: (params?: Params) => g("/admin/datasets/food-lookups/", params),
      exportFoodLookups: (data: unknown) => p("/admin/datasets/food-lookups/", data),
      mealPhotos: (params?: Params) => g("/admin/datasets/meal-photos/", params),
      exportMealPhotos: (data: unknown) => p("/admin/datasets/meal-photos/", data),
      barcodeScans: (params?: Params) => g("/admin/datasets/barcode-scans/", params),
      exportBarcodeScans: (data: unknown) => p("/admin/datasets/barcode-scans/", data),
      voiceCommands: (params?: Params) => g("/admin/datasets/voice-commands/", params),
      exportVoiceCommands: (data: unknown) => p("/admin/datasets/voice-commands/", data),
      exportLogs: (params?: Params) => g("/admin/datasets/export-logs/", params),
    },

    // ── REVIEWS ───────────────────────────────────────────
    reviews: {
      list: (params?: Params) => g("/admin/reviews/", params),
      delete: (id: string) => d(`/admin/reviews/${id}/delete/`),
    },

    // ── COUPONS ───────────────────────────────────────────
    coupons: {
      list: (params?: Params) => g("/admin/coupons/", params),
      create: (data: unknown) => p("/admin/coupons/create/", data),
      update: (id: string, data: unknown) => u(`/admin/coupons/${id}/update/`, data),
      delete: (id: string) => d(`/admin/coupons/${id}/delete/`),
    },

    // ── STUDIO / VIDEO MODERATION ────────────────────────
    studio: {
      videos: {
        list: (params?: Params) => g("/admin/studio/videos/", params),
        detail: (id: string) => g(`/admin/studio/videos/${id}/`),
        approve: (id: string, adminNotes?: string) => p(`/admin/studio/videos/${id}/approve/`, adminNotes ? { admin_notes: adminNotes } : {}),
        reject: (id: string, reason: string) => p(`/admin/studio/videos/${id}/reject/`, { reason }),
        retrigger: (id: string) => p(`/admin/studio/videos/${id}/retrigger/`),
        bulkAction: (action: string, videoIds: string[], reason?: string) =>
          p("/admin/studio/videos/bulk-action/", { action, video_ids: videoIds, ...(reason ? { reason } : {}) }),
        music: (id: string) => g(`/admin/studio/videos/${id}/music/`),
      },
      reports: {
        list: (params?: Params) => g("/admin/studio/reports/", params),
        detail: (id: string) => g(`/admin/studio/reports/${id}/`),
        resolve: (id: string) => p(`/admin/studio/reports/${id}/resolve/`),
      },
      appeals: {
        list: (params?: Params) => g("/admin/studio/appeals/", params),
        detail: (id: string) => g(`/admin/studio/appeals/${id}/`),
        approve: (id: string, adminNotes?: string) => p(`/admin/studio/appeals/${id}/approve/`, adminNotes ? { admin_notes: adminNotes } : {}),
        reject: (id: string, reason?: string) => p(`/admin/studio/appeals/${id}/reject/`, reason ? { reason } : {}),
      },
      suspendUploads: (userId: number) => p(`/admin/studio/trainers/${userId}/suspend-uploads/`),
      unsuspendUploads: (userId: number) => d(`/admin/studio/trainers/${userId}/suspend-uploads/`),
    },

    // ── TRAINER EARNINGS / COMMISSION / PAYOUTS (finance back-office) ──
    // Base: /admin/trainer-earnings/*. Most endpoints use the api_response()
    // wrapper (auto-unwrapped → these return the inner `data`). The list
    // endpoints marked DRF below return raw { count, next, previous, results }.
    trainerEarnings: {
      // Commission config — GET returns config object; PATCH accepts a subset.
      config: {
        get: () => g("/admin/trainer-earnings/commission-config/"),
        update: (data: unknown) => pt("/admin/trainer-earnings/commission-config/", data),
      },
      // Commission tiers — list is api_response with { results } (NOT paginated).
      tiers: {
        list: (params?: Params) => g<{ results: unknown[] }>("/admin/trainer-earnings/commission-tiers/", params),
        create: (data: unknown) => p("/admin/trainer-earnings/commission-tiers/", data),
        detail: (id: number | string) => g(`/admin/trainer-earnings/commission-tiers/${id}/`),
        // PATCH restricted to { is_active, label }.
        update: (id: number | string, data: unknown) => pt(`/admin/trainer-earnings/commission-tiers/${id}/`, data),
        supersede: (id: number | string, data: unknown) => p(`/admin/trainer-earnings/commission-tiers/${id}/supersede/`, data),
        simulate: (data: unknown) => p("/admin/trainer-earnings/commission-tiers/simulate/", data),
      },
      // Per-trainer commission override — GET/PATCH.
      commissionOverride: {
        get: (trainerId: number | string) => g(`/admin/trainer-earnings/trainers/${trainerId}/commission-override/`),
        update: (trainerId: number | string, pct: number | null) =>
          pt(`/admin/trainer-earnings/trainers/${trainerId}/commission-override/`, { commission_override_pct: pct }),
      },
      // Earnings ledger.
      entries: (params?: Params) => g("/admin/trainer-earnings/entries/", params), // DRF paginated
      summary: (params?: Params) => g("/admin/trainer-earnings/summary/", params),
      // export/ returns a file (CSV/XLSX); use the raw api for blobs elsewhere.
      exportUrl: (params?: Params) => `/admin/trainer-earnings/export/${qs(params)}`,
      // Manual mark a (non-Stripe) payment as paid.
      paymentMarkPaid: (paymentId: number | string, reference: string) =>
        p(`/admin/trainer-earnings/payments/${paymentId}/mark-paid/`, { reference }),
      // Payout requests + admin actions.
      payoutRequests: {
        list: (params?: Params) => g("/admin/trainer-earnings/payout-requests/", params), // DRF paginated
        detail: (id: number | string) => g(`/admin/trainer-earnings/payout-requests/${id}/`),
        approve: (id: number | string, force = false) =>
          p(`/admin/trainer-earnings/payout-requests/${id}/approve/`, force ? { force: true } : {}),
        underReview: (id: number | string, note?: string) =>
          p(`/admin/trainer-earnings/payout-requests/${id}/under-review/`, note ? { note } : {}),
        retry: (id: number | string, payoutReference?: string) =>
          p(`/admin/trainer-earnings/payout-requests/${id}/retry/`, payoutReference ? { payout_reference: payoutReference } : {}),
        reject: (id: number | string, reason: string) =>
          p(`/admin/trainer-earnings/payout-requests/${id}/reject/`, { reason }),
        markPaid: (id: number | string, payoutReference: string) =>
          p(`/admin/trainer-earnings/payout-requests/${id}/mark-paid/`, { payout_reference: payoutReference }),
      },
      // Risk.
      riskAssessment: {
        get: (trainerId: number | string) => g(`/admin/trainer-earnings/trainers/${trainerId}/risk-assessment/`),
        persist: (trainerId: number | string) => p(`/admin/trainer-earnings/trainers/${trainerId}/risk-assessment/`),
      },
      riskDecisions: (params?: Params) => g("/admin/trainer-earnings/payout-risk-decisions/", params), // DRF paginated
      // Ledger audit runs.
      auditRuns: {
        list: (params?: Params) => g("/admin/trainer-earnings/ledger-audit-runs/", params), // DRF paginated
        detail: (id: number | string) => g(`/admin/trainer-earnings/ledger-audit-runs/${id}/`),
        runNow: () => p("/admin/trainer-earnings/ledger-audit-runs/run-now/"),
      },
      // Monthly sweep.
      sweep: {
        preview: () => g("/admin/trainer-earnings/monthly-sweep-preview/"),
        runs: (params?: Params) => g("/admin/trainer-earnings/sweep-runs/", params), // DRF paginated
        runDetail: (id: number | string) => g(`/admin/trainer-earnings/sweep-runs/${id}/`),
      },
      // Finance analytics.
      analytics: (params?: Params) => g("/admin/trainer-earnings/finance-analytics/", params),
      // Stripe reconciliation.
      reconciliation: {
        list: (params?: Params) => g("/admin/trainer-earnings/stripe-reconciliation-runs/", params), // DRF paginated
        detail: (id: number | string) => g(`/admin/trainer-earnings/stripe-reconciliation-runs/${id}/`),
        runNow: (data?: { window_days?: number; include_orphan_detection?: boolean }) =>
          p("/admin/trainer-earnings/stripe-reconciliation-runs/run-now/", data || {}),
      },
      // Trainer-earnings notification feed.
      notifications: {
        list: (params?: Params) => g("/admin/trainer-earnings/notifications/", params), // DRF paginated
        unreadCount: () => g<{ unread_count: number }>("/admin/trainer-earnings/notifications/unread-count/"),
        markAllRead: () => p("/admin/trainer-earnings/notifications/mark-all-read/"),
        bulkMarkRead: (ids: number[]) => p("/admin/trainer-earnings/notifications/bulk-mark-read/", { ids }),
        markRead: (id: number | string) => p(`/admin/trainer-earnings/notifications/${id}/mark-read/`),
        resolve: (id: number | string, note?: string) =>
          p(`/admin/trainer-earnings/notifications/${id}/resolve/`, note ? { note } : {}),
      },
      // Financial transactions journal.
      transactions: {
        list: (params?: Params) => g("/admin/trainer-earnings/financial-transactions/", params), // DRF paginated
        manualAdjustment: (data: {
          amount: number | string;
          description: string;
          currency?: string;
          trainer_id?: number;
          reference?: string;
        }) => p("/admin/trainer-earnings/financial-transactions/manual-adjustment/", data),
      },
      // Financial incidents.
      incidents: {
        list: (params?: Params) => g("/admin/trainer-earnings/financial-incidents/", params), // DRF paginated
        detail: (id: number | string) => g(`/admin/trainer-earnings/financial-incidents/${id}/`),
        create: (data: { title: string; incident_type?: string; description?: string; severity?: string; trainer_id?: number }) =>
          p("/admin/trainer-earnings/financial-incidents/create/", data),
        assign: (id: number | string, assignedToId: number | null) =>
          p(`/admin/trainer-earnings/financial-incidents/${id}/assign/`, { assigned_to_id: assignedToId }),
        resolve: (id: number | string, data: { status?: string; resolution?: string }) =>
          p(`/admin/trainer-earnings/financial-incidents/${id}/resolve/`, data),
      },
      // Hold policy rules (dynamic earning-hold).
      holdPolicyRules: {
        list: (params?: Params) => g<{ results: unknown[] }>("/admin/trainer-earnings/hold-policy-rules/", params),
        create: (data: unknown) => p("/admin/trainer-earnings/hold-policy-rules/", data),
        detail: (id: number | string) => g(`/admin/trainer-earnings/hold-policy-rules/${id}/`),
        update: (id: number | string, data: unknown) => pt(`/admin/trainer-earnings/hold-policy-rules/${id}/`, data),
        delete: (id: number | string) => d(`/admin/trainer-earnings/hold-policy-rules/${id}/`),
        resolvedHoldHours: (trainerId: number | string) =>
          g(`/admin/trainer-earnings/trainers/${trainerId}/resolved-hold-hours/`),
      },
      // Reserve holds.
      reserveHolds: {
        list: (params?: Params) => g("/admin/trainer-earnings/reserve-holds/", params), // DRF paginated
        detail: (id: number | string) => g(`/admin/trainer-earnings/reserve-holds/${id}/`),
        forfeit: (id: number | string, reason: string) =>
          p(`/admin/trainer-earnings/reserve-holds/${id}/forfeit/`, { reason }),
        releaseNow: () => p("/admin/trainer-earnings/reserve-holds/release-now/"),
        summary: (trainerId: number | string) => g(`/admin/trainer-earnings/trainers/${trainerId}/reserve-summary/`),
      },
    },
  };
}

export type AdminApi = ReturnType<typeof createAdminApi>;
