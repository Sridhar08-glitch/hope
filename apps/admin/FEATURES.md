# Holora Admin Dashboard — Complete Feature Documentation

> Auto-generated feature audit of every screen, action, and API endpoint in the admin panel.

---

## Architecture Overview

| Aspect | Detail |
|--------|--------|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + BRAND design tokens |
| State | React hooks only (no external state management) |
| Animation | Framer Motion |
| Charts | Recharts (pie, bar, area, sparklines) |
| Icons | Lucide React |
| API Client | `@holora/api-client` with auto-unwrapping interceptor |
| Auth | JWT via `@holora/auth` (AuthProvider + useAuth) |

**Shared Design System** (`components/shared.tsx`):
PageHeader, TabBar, Modal, ConfirmDialog, EmptyState, DataTable, TR, TD, StatCard, StatusBadge, SimplePagination, PrimaryButton, GhostButton, FormField, useDebouncedValue, fadeUp animation variant

---

## Navigation Structure

| Group | Screens |
|-------|---------|
| **Core** | Dashboard, User Management |
| **Ecosystem** | Communities, Chat & Moderation, Events, Fitness Records, Nutrition & Meals, Recovery & Wellness, Trainers & Booking, Studio & Videos, Content Plans, Shop & Orders, Notifications, Finance & Wallets |
| **Business** | Subscriptions, Pricing Engine |
| **Operations** | Audit & Logs, Alerts & Appeals, Datasets |

---

## 1. Login

- Email + password authentication (admin-only)
- HOLORA PERFORMANCE branding with logo
- Error display with AlertCircle icon
- Loading state during authentication
- "All actions are logged" security notice
- API: `POST /admin/login/`

---

## 2. Dashboard

### KPI Cards (with sparkline mini-charts)
- Total Trainers (active count subtitle)
- Revenue (all-time)
- Total Bookings (pending count subtitle)
- Pending Applications

### Charts
- **Event Breakdown** — Recharts PieChart (approved/pending/rejected)
- **Moderation Summary** — Recharts BarChart (reports, bans, mutes, violations, appeals)
- **Bookings Summary** — Recharts BarChart (pending/completed/cancelled + revenue)

### Tables
- Top Trainers (name, rating, sessions, reviews)

### Quick Stats Footer
- Verified Trainers, Featured Trainers, Active Trainers, Total Events

### APIs
- `GET /admin/moderation/stats/`
- `GET /admin/events/stats/`
- `GET /admin/trainer-dashboard/stats/`
- `GET /admin/bookings/stats/`

---

## 3. User Management

### List
- Paginated user table (cursor-based)
- Debounced search
- Filters: role, fitness goal, fitness level
- Columns: user (avatar + name + email), role badge, status dot, XP/streak, join date
- Responsive columns (hidden on mobile)

### Actions
- **Create** user (first name, last name, email, role, password)
- **Edit** user (first name, last name, email, role, active toggle)
- **Delete** user (confirmation dialog)
- **Reset password** (sends email)
- **Bulk delete** (multi-select with checkboxes)
- **Export** users to CSV
- **View detail** (navigates to User Detail)

### APIs
- `GET /admin/users/` | `GET /admin/users/filter-options/`
- `POST /admin/users/create/` | `PUT /admin/users-detail/{id}/`
- `DELETE /admin/users-detail/{id}/` | `POST /admin/users/bulk-delete/`
- `POST /admin/users/{id}/reset-password/`

---

## 4. User Detail

### Profile Header
- Name, email, role badge, active status, ban status
- Stat cards: coin balance, total XP, streak days

### Tabs

**Overview**: Goal, fitness level, join date, phone
**Fitness & Nutrition**: Lifetime stats, best day, 7-day history table, nutrition stats, current meal plan
**Recovery**: Session stats, wellness averages, favorite recovery types
**Social**: Ban status, warning count, moderation details, call history table

### Admin Actions
- Edit profile | Impersonate user | Warn user
- Ban/Unban | Reset password | Download report
- View comprehensive data (JSON modal)

### APIs
- `GET /admin/users/{id}/` | `GET /admin/fitness/users/{id}/summary/`
- `GET /admin/nutrition/users/{id}/summary/` | `GET /admin/recovery/users/{id}/summary/`
- `GET /admin/moderation/users/{id}/status/` | `POST /admin/users/{id}/impersonate/`
- `POST /admin/moderation/users/{id}/warn/` | `POST /admin/moderation/users/{id}/ban/`
- `POST /admin/moderation/users/{id}/unban/` | `GET /admin/users/{id}/report/`
- `GET /admin/users/{id}/comprehensive/`

---

## 5. Communities

### List
- Card grid layout (1/2/3 columns responsive)
- Avatar, name, description, member count, type (public/private), active status

### Actions
- Manage (→ Community Detail) | Edit (name, description, active) | Delete

### APIs
- `GET /admin/communities/` | `PUT /admin/communities/{id}/` | `DELETE /admin/communities/{id}/`

---

## 6. Community Detail

### Header Stats
- Member count, active today, pending reports

### Tabs
**Members**: Search, table (profile, role, mute status), mute/ban actions
**Messages**: Table (sender, content, type, status, date)
**Join Requests**: Table (user, status, date), approve/reject

### APIs
- `GET /admin/communities/{id}/` | `GET /admin/communities/{id}/members/`
- `GET /admin/communities/{id}/messages/` | `GET /admin/community-join-requests/`
- `POST /admin/community-join-requests/{id}/action/`

---

## 7. Chat & Moderation

### Summary Stats (6 metrics)
Reports, Bans, Mutes, Violations, Flagged, Appeals

### 8 Tabs
| Tab | Features |
|-----|----------|
| **Reports** | List, resolve button |
| **Violations** | List, ignore button |
| **Bans** | Table, remove ban, create ban modal (user_id, community_id, reason, days, permanent) |
| **Mutes** | Table, remove mute, create mute modal (user_id, community_id, hours, reason) |
| **Messages** | Community messages list |
| **Calls** | Stats dashboard + call records (caller, type, duration, status) |
| **Online** | User grid with green status dots |
| **Private Msgs** | Private messages to moderate |

### APIs
- `GET /admin/moderation/stats/` | `GET /admin/reports/` | `POST /admin/reports/{id}/resolve/`
- `GET /admin/message-violations/` | `DELETE /admin/message-violations/{id}/ignore/`
- `GET/POST /admin/community-bans/` | `DELETE /admin/community-bans/{id}/remove/`
- `GET/POST /admin/community-mutes/` | `DELETE /admin/community-mutes/{id}/remove/`
- `GET /admin/calls/` | `GET /admin/calls/stats/` | `GET /admin/presence/online/`
- `GET /admin/private-messages/`

---

## 8. Events

### List
- Table with status filter tabs (All/Pending/Approved/Rejected)
- Multi-select with bulk approve/reject/delete
- Export CSV

### Actions
- Approve | Reject (with reason modal) | Delete | Edit | View detail

### APIs
- `GET /admin/events/` | `GET /admin/events/stats/`
- `POST /admin/events/{id}/approve/` | `POST /admin/events/{id}/reject/`
- `DELETE /admin/events/{id}/` | `PUT /admin/events/{id}/`
- `POST /admin/events/bulk-action/`

---

## 9. Fitness Records

### 3 Tabs
| Tab | Features |
|-----|----------|
| **Records** | CRUD, filters, bulk delete, import CSV, export |
| **Sessions** | List, delete |
| **Stats** | Overall/today/weekly stat grids |

### APIs
- `GET /admin/fitness/records/` | `POST/PUT/DELETE` CRUD
- `POST /admin/fitness/records/bulk-delete/` | `POST /admin/fitness/records/bulk-import/`
- `GET /admin/fitness/sessions/` | `GET /admin/fitness/stats/` | `GET /admin/fitness/filter-options/`

---

## 10. Nutrition & Meals

### 5 Tabs
| Tab | Features |
|-----|----------|
| **Meals** | CRUD, filters, bulk delete, export |
| **Daily Progress** | CRUD |
| **Weekly Plans** | CRUD, bulk delete |
| **Stats** | Overall/today/weekly grids |
| **Cache** | Cache metrics, bulk cache, food lookup debug tool |

### APIs
- `GET /admin/nutrition/meals/` | `GET /admin/daily-progress/` | `GET /admin/weekly-meal-plans/`
- Full CRUD on each + `GET /admin/nutrition/stats/` | `GET /admin/nutrition/cache-metrics/`
- `POST /admin/nutrition/food-lookup-debug/` | `GET /admin/nutrition/filter-options/`

---

## 11. Recovery & Wellness

### 6 Tabs
| Tab | Features |
|-----|----------|
| **Sessions** | CRUD, bulk delete, filters |
| **Wellness** | CRUD, filters |
| **Scores** | List, recalculate button |
| **Types** | CRUD, bulk activate/deactivate/delete |
| **Mobile Usage** | Edit records |
| **Stats** | Overall/today grids |

### APIs
- Full CRUD on sessions, wellness, types + scores recalculate
- `POST /admin/recovery/types/bulk-action/` | `POST /admin/recovery/sessions/bulk-delete/`
- `GET /admin/recovery/stats/` | `GET /admin/recovery/filter-options/`

---

## 12. Trainers & Booking

### 8 Tabs
| Tab | Features |
|-----|----------|
| **Applications** | List, stats, approve/reject with reason, view detail |
| **Trainers** | List, bulk actions (verify/unverify/feature/deactivate), edit, delete, view detail |
| **Bookings** | List, cancel, refund, view detail |
| **Payments** | List, refund, view detail |
| **Subscriptions** | List, cancel, view detail |
| **Plans** | Full CRUD |
| **Reviews** | List, delete, view detail |
| **Coupons** | Full CRUD |

### APIs
- `GET /admin/trainers/applications/` | approve/reject | stats
- `GET /admin/trainers/` | verify/unverify/feature/unfeature/activate/deactivate | bulk-action
- `GET /admin/bookings/` | cancel/refund | `GET /admin/payments/` | refund
- Full CRUD on plans, coupons | `GET /admin/reviews/` | delete

---

## 13. Studio & Videos

### 3 Tabs
| Tab | Features |
|-----|----------|
| **Videos** | Search + status filter, multi-select, bulk approve/reject/delete, individual approve/reject/retrigger, video preview modal (with video player, metadata, moderation result, music tracks) |
| **Reports** | Content reports list, resolve button |
| **Appeals** | Video appeals list, approve/reject |

### APIs
- `GET /admin/studio/videos/` | `POST .../approve/` | `POST .../reject/` | `POST .../retrigger/`
- `POST /admin/studio/videos/bulk-action/` | `GET .../music/`
- `GET /admin/studio/reports/` | `POST .../resolve/`
- `GET /admin/studio/appeals/` | `POST .../approve/` | `POST .../reject/`

---

## 14. Content Plans

### 2 Tabs
- **Workout Plans** — List, delete
- **Meal Plans** — List, delete

### APIs
- `GET /admin/workout-plans/` | `DELETE /admin/workout-plans/{id}/`
- `GET /admin/trainer-meal-plans/` | `DELETE /admin/trainer-meal-plans/{id}/`

---

## 15. Shop & Orders

### 5 Tabs
| Tab | Features |
|-----|----------|
| **Products** | List, create, edit, delete, duplicate, update stock, export |
| **Orders** | List, update status, cancel, refund, invoice, export |
| **Reviews** | List, approve, delete |
| **Coupons** | Full CRUD (code, discount type, value, min order, max uses, active) |
| **Returns** | List, update status, delete |

### APIs
- `GET /admin-shop/dashboard/` | Full CRUD on products, orders, reviews, coupons, returns

---

## 16. Notifications

### 4 Tabs
| Tab | Features |
|-----|----------|
| **List** | Filter by type/status/priority/channel, search, view detail, delete |
| **Send** | Single user / by role / bulk send with title, body, type, deep link, image, screen |
| **Stats** | Delivery statistics |
| **Templates** | Templates list |

### APIs
- `GET /admin/notifications/` | `POST /admin/notifications/create/`
- `POST /admin/notifications/bulk-send/` | `POST /admin/notifications/send-to-role/`
- `GET /admin/notifications/stats/` | `GET /admin/notifications/templates/`

---

## 17. Finance & Wallets

### 4 Tabs
| Tab | Features |
|-----|----------|
| **Dashboard** | Summary stats, reward stats, recent transactions |
| **Wallets** | Search, list, view detail modal, manual reward modal |
| **Transactions** | Filter by type/reason, search, list |
| **Stats** | Key-value stats grid |

### APIs
- `GET /admin/FinanceDashboard/` | `GET /admin/finance/wallets/`
- `GET /admin/finance/wallets/{id}/` | `GET /admin/finance/wallets/stats/`
- `GET /admin/finance/wallets/transactions/` | `POST /admin/finance/wallets/manual-reward/`

---

## 18. Subscriptions

### 9 Tabs
| Tab | Features |
|-----|----------|
| **Plans** | List with pricing |
| **User Subs** | List, cancel/upgrade/downgrade, view detail |
| **Referrals** | Sub-tabs: Codes, Users, Distributions (approve), Stats |
| **Coins** | Adjustments (approve), distribution config (delete), analytics |
| **Payments** | List, analytics |
| **Reports** | Revenue, churn, LTV stats |
| **Cycles** | Billing cycles list |
| **Refunds** | List, approve |
| **Webhooks** | Stripe webhooks list |

### APIs
- 25+ subscription management endpoints across plans, users, referrals, coins, payments, reports, cycles, refunds

---

## 19. Pricing Engine

### 10 Tabs
Engine Status, Tiers, Countries (edit), Founder Passes (CRUD), Campaigns (CRUD), Coin Packages, Germany (edit), Launch Discounts, Founder Campaigns, Coin Config

- Price preview calculator
- Singular config editors (germany, coin-config)
- List CRUD for passes, campaigns

---

## 20. Audit & Logs

### 6 Tabs
| Tab | Features |
|-----|----------|
| **Audit Logs** | Timestamped admin action log |
| **User Actions** | User action history |
| **Segments** | CRUD segments, view segment users |
| **Bulk History** | Bulk operation audit trail |
| **Violations** | Policy violation records |
| **Advanced Search** | Search across users, trainers, applications, bookings |

---

## 21. Alerts & Appeals

### 5 Tabs
| Tab | Features |
|-----|----------|
| **Alerts** | Summary by severity, acknowledge/dismiss, check for new alerts |
| **Alert Configs** | Full CRUD (name, type, threshold, active) |
| **Approvals** | Pending/my requests/history, approve/reject, create new |
| **Ban Appeals** | List, approve/reject |
| **Session Appeals** | List, approve/refund/reject, view detail |

---

## 22. Datasets

### 6 Tabs
Food Lookups, Meal Photos, Barcode Scans, Voice Commands, User Nutrition, Export Logs

- Browse tabular data (dynamic columns)
- Export each dataset

---

## Cross-Cutting Features

| Feature | Implementation |
|---------|---------------|
| **Authentication** | JWT with auto-refresh interceptor |
| **API Unwrapping** | Response interceptor strips `{ success, data }` envelope |
| **Error Handling** | ErrorBoundary + try-catch + toast notifications |
| **Loading States** | Skeleton loaders (dashboard) + Spinner (views) |
| **Empty States** | Icon + message per view |
| **Animations** | Framer Motion fadeUp stagger + AnimatePresence page transitions |
| **Debounced Search** | 400ms debounce on user and video search |
| **Responsive** | Sidebar: fixed mobile / static desktop. Tables: overflow-x-auto. Grids: responsive cols |
| **Accessibility** | aria-labels on icon buttons, aria-current on active nav, semantic HTML |
| **Cross-Browser** | -webkit-backdrop-filter, viewport meta, safe-area insets |
| **Reduced Motion** | `prefers-reduced-motion` media query support |

---

## API Coverage Summary

| Category | Endpoints |
|----------|-----------|
| Dashboard | 4 |
| Users | 10 |
| Communities | 8 |
| Moderation | 18 |
| Events | 7 |
| Fitness | 10 |
| Nutrition | 15 |
| Recovery | 15 |
| Trainers | 25 |
| Studio/Videos | 12 |
| Shop | 20 |
| Notifications | 7 |
| Finance | 6 |
| Subscriptions | 25+ |
| Pricing | 10 |
| Audit | 8 |
| Alerts | 10 |
| Datasets | 6 |
| **Total** | **~200+** |

---

## File Structure

```
apps/admin/src/
├── app/
│   ├── layout.tsx          (viewport, metadata)
│   ├── page.tsx            (AuthProvider wrapper)
│   └── globals.css         (Tailwind + scrollbar + reduced motion)
├── components/
│   ├── admin-app.tsx       (shell: sidebar + header + view routing)
│   ├── login-view.tsx      (authentication)
│   ├── error-boundary.tsx  (crash recovery)
│   ├── shared.tsx          (design system: 15+ shared components)
│   └── views/
│       ├── dashboard-view.tsx
│       ├── users-view.tsx
│       ├── user-detail-view.tsx
│       ├── communities-view.tsx
│       ├── community-detail-view.tsx
│       ├── moderation-view.tsx
│       ├── events-view.tsx
│       ├── event-detail-view.tsx
│       ├── fitness-view.tsx
│       ├── nutrition-view.tsx
│       ├── recovery-view.tsx
│       ├── trainers-view.tsx
│       ├── trainer-detail-view.tsx
│       ├── trainer-app-detail-view.tsx
│       ├── studio-view.tsx
│       ├── content-view.tsx
│       ├── shop-view.tsx
│       ├── notifications-view.tsx
│       ├── finance-view.tsx
│       ├── subscriptions-view.tsx
│       ├── pricing-view.tsx
│       ├── audit-view.tsx
│       ├── alerts-view.tsx
│       └── datasets-view.tsx
└── lib/
    ├── admin-api.ts        (25 API method groups, 200+ endpoints)
    └── nav-config.ts       (19 nav items, 4 groups)
```
