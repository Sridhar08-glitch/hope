# Admin Panel — Backend Gaps & Implementation Status

> Generated: 2026-06-14
> Last updated: 2026-06-14
> Scope: Tracks what backend endpoints are wired in the frontend admin panel, what was fixed, and what still needs backend work.

---

## 1. RESOLVED: Shop URL Prefix Mismatch

**Status: FIXED in frontend** — `adminApi.js` now uses `admin-shop/...` prefix matching the backend.

| Frontend (old) | Frontend (new) | Backend | Status |
|---|---|---|---|
| `admin/ShopDashboard/` | `admin-shop/dashboard/` | `admin-shop/dashboard/` | **FIXED** |
| `admin/shop/products/` | `admin-shop/products/` | `admin-shop/products/` | **FIXED** |
| `admin/shop/products/create/` | `admin-shop/products/create/` | `admin-shop/products/create/` | **FIXED** |
| `admin/shop/products/{id}/` | `admin-shop/products/{id}/` | `admin-shop/products/{id}/` | **FIXED** |
| `admin/shop/products/{id}/update/` | `admin-shop/products/{id}/update/` | `admin-shop/products/{id}/update/` | **FIXED** |
| `admin/shop/products/{id}/delete/` | `admin-shop/products/{id}/delete/` | `admin-shop/products/{id}/delete/` | **FIXED** |
| `admin/shop/orders/` | `admin-shop/orders/` | `admin-shop/orders/` | **FIXED** |
| `admin/shop/orders/{id}/` | `admin-shop/orders/{id}/` | `admin-shop/orders/{id}/` | **FIXED** |
| `admin/shop/orders/{id}/update/` | `admin-shop/orders/{id}/update/` | `admin-shop/orders/{id}/update/` | **FIXED** |
| `admin/shop/reviews/` | `admin-shop/reviews/` | `admin-shop/reviews/` | **FIXED** |
| `admin/shop/reviews/{id}/update/` | `admin-shop/reviews/{id}/update/` | `admin-shop/reviews/{id}/update/` | **FIXED** |
| `admin/shop/reviews/{id}/delete/` | `admin-shop/reviews/{id}/delete/` | `admin-shop/reviews/{id}/delete/` | **FIXED** |

---

## 2. RESOLVED: Backend Endpoints Now Wired in Frontend

All of the following were previously unwired. They now have both API definitions in `adminApi.js` and UI views in the admin panel.

### 2.1 Subscriptions — NEW section in admin panel
**Frontend:** `src/modules/subscriptions/SubscriptionsView.jsx`
**Tabs:** Plans, User Subs, Referrals, Coins, Payments, Reports

| Endpoint | Wired in adminApi.js | UI |
|---|---|---|
| `admin/subscriptions/plans/` | `adminApi.subs.plans.list` | Plans tab |
| `admin/subscriptions/plans/{id}/` | `adminApi.subs.plans.detail` | Plans tab |
| `admin/subscriptions/plans/{id}/pricing/` | `adminApi.subs.plans.pricing` | Plans tab |
| `admin/subscriptions/plans/{id}/psychological-pricing/` | `adminApi.subs.plans.psychPricing` | Plans tab |
| `admin/subscriptions/plans/{id}/audit/` | `adminApi.subs.plans.audit` | Plans tab |
| `admin/subscriptions/plans/bulk-update/` | `adminApi.subs.plans.bulkUpdate` | Plans tab |
| `admin/subscriptions/users/` | `adminApi.subs.users.list` | User Subs tab |
| `admin/subscriptions/users/{id}/` | `adminApi.subs.users.detail` | User Subs tab |
| `admin/subscriptions/users/{id}/cancel/` | `adminApi.subs.users.cancel` | User Subs tab |
| `admin/subscriptions/users/{id}/downgrade/` | `adminApi.subs.users.downgrade` | User Subs tab |
| `admin/subscriptions/users/{id}/upgrade/` | `adminApi.subs.users.upgrade` | User Subs tab |
| `admin/subscriptions/cycles/` | `adminApi.subs.cycles` | ✅ API only |
| `admin/subscriptions/analytics/` | `adminApi.subs.analytics` | ✅ API only |
| `admin/subscriptions/referrals/codes/` | `adminApi.subs.referrals.codes` | Referrals tab |
| `admin/subscriptions/referrals/users/` | `adminApi.subs.referrals.users` | Referrals tab |
| `admin/subscriptions/referrals/distributions/` | `adminApi.subs.referrals.distributions` | Referrals tab |
| `admin/subscriptions/referrals/distributions/{id}/approve/` | `adminApi.subs.referrals.approveDistribution` | Referrals tab |
| `admin/subscriptions/referrals/stats/` | `adminApi.subs.referrals.stats` | Referrals tab |
| `admin/subscriptions/coins/adjustments/` | `adminApi.subs.coins.adjustments` | Coins tab |
| `admin/subscriptions/coins/adjustments/{id}/approve/` | `adminApi.subs.coins.approveAdjustment` | Coins tab |
| `admin/subscriptions/coins/distribution-config/` | `adminApi.subs.coins.distributionConfig` | Coins tab |
| `admin/subscriptions/coins/distribution-config/{id}/` | `adminApi.subs.coins.updateConfig` | ✅ API only |
| `admin/subscriptions/coins/analytics/` | `adminApi.subs.coins.analytics` | Coins tab |
| `admin/subscriptions/payments/` | `adminApi.subs.payments.list` | Payments tab |
| `admin/subscriptions/payments/{id}/` | `adminApi.subs.payments.detail` | Payments tab |
| `admin/subscriptions/payments/analytics/` | `adminApi.subs.payments.analytics` | Payments tab |
| `admin/subscriptions/refunds/` | `adminApi.subs.refunds.list` | Payments tab |
| `admin/subscriptions/refunds/{id}/approve/` | `adminApi.subs.refunds.approve` | Payments tab |
| `admin/subscriptions/webhooks/stripe/` | `adminApi.subs.webhooks.stripe` | ✅ API only |
| `admin/subscriptions/reports/revenue/` | `adminApi.subs.reports.revenue` | Reports tab |
| `admin/subscriptions/reports/churn/` | `adminApi.subs.reports.churn` | Reports tab |
| `admin/subscriptions/reports/ltv/` | `adminApi.subs.reports.ltv` | Reports tab |
| `admin/subscriptions/reports/coin-cost/` | `adminApi.subs.reports.coinCost` | Reports tab |
| `admin/subscriptions/dashboard/health/` | `adminApi.subs.health` | Reports tab |

### 2.2 Pricing Engine — NEW section in admin panel
**Frontend:** `src/modules/pricing/PricingView.jsx`
**Tabs:** Engine Status, Tiers, Countries, Founder Passes, Campaigns, Coin Packages

| Endpoint | Wired in adminApi.js | UI |
|---|---|---|
| `admin/pricing/engine-status/` | `adminApi.pricing.engineStatus` | Engine Status tab |
| `admin/pricing/germany/` | `adminApi.pricing.germany.get` | ✅ API only |
| `admin/pricing/germany/preview/` | `adminApi.pricing.germany.preview` | ✅ API only |
| `admin/pricing/tiers/` | `adminApi.pricing.tiers.list` | Tiers tab |
| `admin/pricing/tiers/{code}/` | `adminApi.pricing.tiers.detail` | Tiers tab |
| `admin/pricing/countries/` | `adminApi.pricing.countries.list` | Countries tab |
| `admin/pricing/countries/{code}/` | `adminApi.pricing.countries.detail` | Countries tab |
| `admin/founder-passes/` | `adminApi.pricing.founderPasses.list` | Founder Passes tab |
| `admin/founder-passes/{id}/` | `adminApi.pricing.founderPasses.detail` | Founder Passes tab |
| `admin/pricing/launch-discounts/` | `adminApi.pricing.launchDiscounts.list` | ✅ API only |
| `admin/pricing/launch-discounts/{id}/` | `adminApi.pricing.launchDiscounts.detail` | ✅ API only |
| `admin/pricing/campaigns/` | `adminApi.pricing.campaigns.list` | Campaigns tab |
| `admin/pricing/campaigns/{id}/` | `adminApi.pricing.campaigns.detail` | Campaigns tab |
| `admin/pricing/founder-campaigns/` | `adminApi.pricing.founderCampaigns.list` | ✅ API only |
| `admin/pricing/founder-campaigns/{id}/` | `adminApi.pricing.founderCampaigns.detail` | ✅ API only |
| `admin/coin-config/` | `adminApi.pricing.coinConfig.get` | ✅ API only |
| `admin/coin-packages/` | `adminApi.pricing.coinPackages.list` | Coin Packages tab |
| `admin/coin-packages/{id}/` | `adminApi.pricing.coinPackages.detail` | Coin Packages tab |
| `admin/pricing/preview/` | `adminApi.pricing.preview` | ✅ API only |

### 2.3 Audit & Logs — NEW section in admin panel
**Frontend:** `src/modules/audit/AuditView.jsx`
**Tabs:** Audit Logs, User Actions, Segments, Bulk History

| Endpoint | Wired in adminApi.js | UI |
|---|---|---|
| `admin/audit-logs/` | `adminApi.audit.logs` | Audit Logs tab |
| `admin/user-actions/` | `adminApi.audit.userActions` | User Actions tab |
| `admin/violations/` | `adminApi.audit.violations` | ✅ API only |
| `admin/dashboard/stats/` | `adminApi.audit.dashboardStats` | ✅ API only |
| `admin/users/{id}/comprehensive/` | `adminApi.users.comprehensive` | ✅ API only |
| `admin/users/{id}/report/` | `adminApi.users.report` | ✅ API only |
| `admin/search/users/` | `adminApi.search.users` | ✅ API only |
| `admin/search/trainers/` | `adminApi.search.trainers` | ✅ API only |
| `admin/search/applications/` | `adminApi.search.applications` | ✅ API only |
| `admin/search/bookings/` | `adminApi.search.bookings` | ✅ API only |
| `admin/filters/options/` | `adminApi.filters.options` | ✅ API only |
| `admin/filters/presets/` | `adminApi.filters.presets.list` | ✅ API only |
| `admin/segments/` | `adminApi.segments.list` | Segments tab |
| `admin/segments/{id}/` | `adminApi.segments.detail` | Segments tab |
| `admin/segments/{id}/users/` | `adminApi.segments.users` | Segments tab |
| `admin/bulk-action/` | `adminApi.bulk.action` | ✅ API only |
| `admin/bulk-operations/history/` | `adminApi.bulk.history` | Bulk History tab |

### 2.4 Alerts & Appeals — NEW section in admin panel
**Frontend:** `src/modules/alerts/AlertsView.jsx`
**Tabs:** Alerts, Alert Configs, Approvals, Ban Appeals, Session Appeals

| Endpoint | Wired in adminApi.js | UI |
|---|---|---|
| `admin/alerts/` | `adminApi.alerts.list` | Alerts tab |
| `admin/alerts/{id}/action/` | `adminApi.alerts.action` | Alerts tab |
| `admin/alerts/check/` | `adminApi.alerts.check` | Alerts tab |
| `admin/alerts/configs/` | `adminApi.alerts.configs.list` | Alert Configs tab |
| `admin/alerts/configs/{id}/` | `adminApi.alerts.configs.detail` | Alert Configs tab |
| `admin/approvals/` | `adminApi.approvals.list` | Approvals tab |
| `admin/approvals/{id}/action/` | `adminApi.approvals.action` | Approvals tab |
| `admin/approvals/stats/` | `adminApi.approvals.stats` | ✅ API only |
| `admin/ban-appeals/` | `adminApi.moderation.banAppeals.list` | Ban Appeals tab |
| `admin/ban-appeals/{id}/review/` | `adminApi.moderation.banAppeals.review` | Ban Appeals tab |
| `admin/session-appeals/` | `adminApi.trainers.sessionAppeals.list` | Session Appeals tab |
| `admin/session-appeals/{id}/` | `adminApi.trainers.sessionAppeals.detail` | Session Appeals tab |
| `admin/session-appeals/{id}/approve/` | `adminApi.trainers.sessionAppeals.approve` | Session Appeals tab |
| `admin/session-appeals/{id}/refund/` | `adminApi.trainers.sessionAppeals.refund` | Session Appeals tab |
| `admin/session-appeals/{id}/reject/` | `adminApi.trainers.sessionAppeals.reject` | Session Appeals tab |

### 2.5 Datasets — NEW section in admin panel
**Frontend:** `src/modules/datasets/DatasetsView.jsx`
**Tabs:** Food Lookups, Meal Photos, Barcode Scans, Voice Commands, User Nutrition, Export Logs

| Endpoint | Wired in adminApi.js | UI |
|---|---|---|
| `admin/datasets/food-lookups/` | `adminApi.datasets.foodLookups` | Food Lookups tab |
| `admin/datasets/meal-photos/` | `adminApi.datasets.mealPhotos` | Meal Photos tab |
| `admin/datasets/barcode-scans/` | `adminApi.datasets.barcodeScans` | Barcode Scans tab |
| `admin/datasets/voice-commands/` | `adminApi.datasets.voiceCommands` | Voice Commands tab |
| `admin/datasets/user-nutrition/` | `adminApi.datasets.userNutrition` | User Nutrition tab |
| `admin/datasets/export-logs/` | `adminApi.datasets.exportLogs` | Export Logs tab |
| `admin/import-foods/` | `adminApi.datasets.importFoods` | Food Lookups tab |

### 2.6 Additional Endpoints Now in adminApi.js (API wired, no dedicated UI)

These were added to `adminApi.js` and are callable from code. Some have UI in existing views, others are API-only for future use.

| Endpoint | adminApi path | Notes |
|---|---|---|
| `admin/communities/{id}/members/` | `adminApi.communities.members` | Available for CommunitiesView |
| `admin/communities/{id}/messages/` | `adminApi.communities.messages` | Available for CommunitiesView |
| `admin/community-join-requests/` | `adminApi.communities.joinRequests.list` | Available for CommunitiesView |
| `admin/community-join-requests/{id}/action/` | `adminApi.communities.joinRequests.action` | Available for CommunitiesView |
| `admin/private-messages/` | `adminApi.moderation.privateMessages.list` | Available for ModerationView |
| `admin/calls/` | `adminApi.moderation.calls.list` | Available for ModerationView |
| `admin/calls/{id}/` | `adminApi.moderation.calls.detail` | Available for ModerationView |
| `admin/calls/stats/` | `adminApi.moderation.calls.stats` | Available for ModerationView |
| `admin/users/{id}/calls/` | `adminApi.moderation.calls.userHistory` | Available for UserDetailView |
| `admin/presence/online/` | `adminApi.moderation.onlineUsers` | Available for ModerationView |
| `admin/nutrition/cache-metrics/` | `adminApi.nutrition.cacheMetrics` | Available for NutritionView |
| `admin/nutrition/bulk-cache/` | `adminApi.nutrition.bulkCache` | Available for NutritionView |
| `admin/nutrition/food-lookup-debug/` | `adminApi.nutrition.foodLookupDebug` | Available for NutritionView |

### 2.7 Shop — Extra Backend Features Now in adminApi.js

All shop endpoints under `admin-shop/` are now defined in `adminApi.js`. These are API-only (no dedicated UI tabs yet) but available for the ShopView to integrate:

| Endpoint group | adminApi path | Count |
|---|---|---|
| Product variants | `adminApi.shop.variants.*` | 7 endpoints |
| Product restore/stock/duplicate/bulk | `adminApi.shop.products.restore/updateStock/duplicate/bulkUpdate` | 4 endpoints |
| Order cancel/refund/invoice/manual | `adminApi.shop.orders.cancel/refund/invoice/createManual` | 4 endpoints |
| Shop coupons | `adminApi.shop.coupons.*` | 7 endpoints |
| Shipping rules | `adminApi.shop.shippingRules.*` | 6 endpoints |
| Tax rates | `adminApi.shop.taxRates.*` | 5 endpoints |
| Currencies | `adminApi.shop.currencies.*` | 7 endpoints |
| Regions | `adminApi.shop.regions.*` | 6 endpoints |
| Returns | `adminApi.shop.returns.*` | 5 endpoints |
| Replacements | `adminApi.shop.replacements.*` | 3 endpoints |
| Back-in-stock | `adminApi.shop.backInStock.*` | 4 endpoints |
| Pincodes | `adminApi.shop.pincodes.*` | 6 endpoints |
| Store settings | `adminApi.shop.settings.*` | 5 endpoints |
| Customers | `adminApi.shop.customers` | 1 endpoint |
| Exports | `adminApi.shop.exports.*` | 3 endpoints |
| Geo-blocks | `adminApi.shop.geoBlocks` | 1 endpoint |

---

## 3. STILL PENDING: Frontend Calls with NO Backend Implementation

These frontend endpoints are called by `ShopView.jsx` tabs but have no matching backend views. **Backend needs to add these list views.**

| Frontend Endpoint | Frontend Section | Backend Fix Needed |
|---|---|---|
| `admin-shop/wishlists/` | Shop Wishlists tab | Add `AdminWishlistListView` |
| `admin-shop/carts/` | Shop Carts tab | Add `AdminCartListView` |
| `admin-shop/coin-transactions/` | Shop Coins tab | Add `AdminCoinTransactionListView` |
| `admin-shop/cart-items/` | Shop Cart Items tab | Add `AdminCartItemListView` |
| `admin-shop/order-items/` | Shop Order Items tab | Add `AdminOrderItemListView` |

### Fix Required
Add these 5 list views to `custom_admin/views/shops_views.py` and register in `custom_admin/urls.py`:
```python
path('admin-shop/wishlists/', AdminWishlistListView.as_view(), name='admin-wishlists'),
path('admin-shop/carts/', AdminCartListView.as_view(), name='admin-carts'),
path('admin-shop/coin-transactions/', AdminCoinTransactionListView.as_view(), name='admin-coin-transactions'),
path('admin-shop/cart-items/', AdminCartItemListView.as_view(), name='admin-cart-items'),
path('admin-shop/order-items/', AdminOrderItemListView.as_view(), name='admin-order-items'),
```

---

## 4. Summary

### What was done (frontend)
| Change | Files |
|---|---|
| Fixed shop URL prefix (`admin/shop/` → `admin-shop/`) | `adminApi.js` |
| Added ~160 missing backend endpoints to API service | `adminApi.js` |
| Added Subscriptions section | `modules/subscriptions/SubscriptionsView.jsx` |
| Added Pricing Engine section | `modules/pricing/PricingView.jsx` |
| Added Audit & Logs section | `modules/audit/AuditView.jsx` |
| Added Alerts & Appeals section | `modules/alerts/AlertsView.jsx` |
| Added Datasets section | `modules/datasets/DatasetsView.jsx` |
| Updated sidebar with Business + Operations groups | `components/layout/Sidebar.jsx` |
| Updated admin router for new sections | `pages/Admin.jsx` |

### Current coverage
- **Backend endpoints implemented:** ~300+
- **Frontend API definitions (adminApi.js):** ~300+ (all backend endpoints now covered)
- **Frontend UI views:** ~18 sections, ~70+ tabs
- **Endpoints with UI:** ~200+
- **Endpoints API-only (no dedicated UI):** ~100 (callable but need UI integration into existing views)
- **Frontend calls with no backend:** 5 (Shop list views — backend needs to add)

### Remaining backend work
1. Add 5 missing Shop list endpoints (wishlists, carts, cart-items, order-items, coin-transactions)
2. All other backend endpoints are fully operational and wired in the frontend
