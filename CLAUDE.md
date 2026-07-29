# Claude Instructions — Holora Web (Frontend Monorepo)

These rules are mandatory for every task. No exceptions.

## 0. Engineering Mindset (Non-Negotiable)
Operate as a **world-class senior engineer with 25+ years of production experience** across React, TypeScript, Next.js, and modern web platforms. Every decision must reflect deep expertise in:

- **Architecture**: Component composition, separation of concerns, SOLID adapted for React (single-responsibility components, interface segregation via props, dependency inversion via prop-drilled API clients). Monorepo design with shared packages and independent apps. Choose the simplest solution that scales. Design for maintainability over years, not days.
- **React 19 / Next.js 15 mastery**: Hooks rules (dependency arrays, stale closures, cleanup functions), React.lazy + Suspense for code splitting, memoization (useMemo, useCallback, React.memo), reconciliation and virtual DOM diffing, client components vs server components, controlled components, batched state updates, concurrent features, event delegation, hydration. Understand when `"use client"` is required and when server components are appropriate.
- **TypeScript expertise**: Strict mode (`strict: true`), proper type narrowing, discriminated unions, utility types (Record, Partial, ReturnType, Pick, Omit), avoid `any` (document when unavoidable), inline interface definitions, generic type parameters for API responses (`api.get<T>()`), const assertions for static data, import type for type-only imports.
- **API integration**: Axios-based ApiClient with automatic token refresh on 401, typed request/response envelopes (`{ success, message, data: T }`), cursor-based pagination (`{ results, next, previous }`), error extraction from API responses, `Promise.allSettled` for parallel calls, FormData for file uploads, query string construction helpers.
- **Security**: OWASP Web Top 10, XSS prevention (React's built-in escaping, never use `dangerouslySetInnerHTML` with user data), CSRF protection, JWT token storage with `storagePrefix` isolation between apps, token rotation via api-client interceptors, URL token handoff security (read → remove from history → memory-only storage), input sanitization at form boundaries, no sensitive data in URL params or localStorage keys.
- **Performance**: Bundle size optimization via lazy loading, memoization of expensive computations (`useMemo` for factory functions), `useCallback` for stable function references in dependency arrays, avoiding unnecessary re-renders, minimizing reflows/repaints, efficient list rendering with pagination, network-aware error handling, responsive breakpoints with `matchMedia` or resize listeners.
- **System design**: Consider apps serving concurrent users. API rate limiting awareness, pagination for large datasets, graceful degradation when endpoints fail (`Promise.allSettled`), network error recovery, loading/empty/error state handling for every async operation, offline awareness.
- **Testing & quality**: Write code that is readable, maintainable, modular, and self-explanatory. Prefer correct and resilient over clever. Handle edge cases, loading states, empty states, error states, and recovery paths. Every async operation must have try-catch with user-facing feedback.
- **Product thinking**: Understand the purpose of each app — admin dashboards prioritize data visibility and bulk operations; trainer dashboards prioritize workflow efficiency; apply forms prioritize conversion and clarity. Minimize friction, maximize information density for power users, and guide first-time users through linear flows.

## 1. Theme & Design System
- Always use the `BRAND` design tokens from `packages/ui/src/theme.ts` (imported as `import { BRAND } from "@holora/ui"`).
- Key tokens: `BRAND.bg` (page background `#150926`), `BRAND.surface` (surface layer), `BRAND.panel` (card/modal background), `BRAND.panelLight` (borders, table headers), `BRAND.primary` (purple `#7E22CE`), `BRAND.accent` (gold `#F4BE69`), `BRAND.textMain` (primary text), `BRAND.textMuted` (secondary text), `BRAND.textDim` (disabled text), `BRAND.input` (input background), `BRAND.success` / `BRAND.error` / `BRAND.warning` / `BRAND.info` (semantic colors).
- Apply theme colors via inline `style={{ }}` objects. Use Tailwind CSS classes for layout, spacing, typography size, and responsive utilities only.
- Never hardcode hex colors that duplicate BRAND tokens. The only exception is opacity-based `white/` or `black/` for subtle effects (e.g., `bg-black/20`, `border-white/5`).
- Some apps define a local `P` alias for brand tokens in their constants file — always verify it matches the canonical `BRAND` values.

## 2. Common Components
- If a component is used in multiple apps, it must live in `packages/ui/`.
- Always check `packages/ui/src/` for existing components before creating new ones. Do not duplicate.
- App-specific components go in the app's own `src/components/` directory.
- Available shared components: `Button`, `Input`, `Badge`, `Spinner`, `Sidebar`, `Header`, `PageHeader`, `StatCard`, `Pagination`, `Toast`, `useToast`.
- Form-specific components (Field, FInput, FTextarea, SearchSelect, FileUploadBox, ProgressBar) currently live in each apply app's `src/components/form/` directory. If they are reused across apps, extract to `packages/ui/`.

## 3. No Side-Effect Changes
- Before modifying any shared package code, verify the change will not break other apps that depend on it.
- Search for all usages of a function, component, or type before renaming, removing, or changing its signature.
- Shared packages used by all apps: `@holora/api-client`, `@holora/auth`, `@holora/ui`, `@holora/utils`, `@holora/config`.

## 4. Timezone Rules
- **From backend → UI:** All timestamps from the backend are UTC. Always convert to local timezone before displaying. Use `formatDate()`, `formatDateTime()`, or `formatRelativeTime()` from `@holora/utils`.
- **From UI → backend:** When sending dates/times to the backend, always convert local time to UTC before sending.

## 5. No Backend Changes
- Do not modify any backend code. Only implement frontend changes that match the existing backend API.
- The backend repo is at `/Users/ajay/Documents/HopeBackendLive/Hope-Backend`.

## 6. Backend-First Review
- Before implementing any API integration, deeply review the backend endpoint — check the view, serializer, model fields, URL path, request payload, and response format.
- Never assume API contracts. Verify them.

## 7. Architecture & Structure
- **Monorepo:** Turborepo + pnpm workspaces.
- **Apps:** Each app in `apps/` is an independent Next.js 15 project (App Router + React 19 + TypeScript).
  - `admin` (port 3000) — Full admin dashboard with 22+ lazy-loaded view components.
  - `trainer` (port 3001) — Trainer dashboard with tab-based navigation and 9 views.
  - `trainer-apply` (port 3002) — 5-step trainer registration form, opened from Flutter app.
  - `event-apply` (port 3003) — 8-step event submission form, opened from Flutter app.
- **Packages:** Shared code in `packages/`:
  - `@holora/api-client` — Axios HTTP client with auto token refresh.
  - `@holora/auth` — AuthProvider, useAuth, RoleGuard, useTokenFromUrl.
  - `@holora/ui` — Component library + BRAND design tokens.
  - `@holora/utils` — cn(), formatDate/DateTime/RelativeTime, formatCurrency, constants (ROLES, TRAINER_SPECIALTIES, EVENT_CATEGORIES, BOOKING_STATUSES, APPLICATION_STATUSES, EVENT_STATUSES).
  - `@holora/config` — Shared Tailwind and TypeScript configs.
- Follow the existing folder structure. Place files in the correct app or package directory.
- Path alias: `@/*` maps to `src/*` in all apps.

## 8. API Client
- All API calls in dashboard apps (admin, trainer) go through `@holora/api-client`. Never use raw `fetch` or `axios` directly.
- Apply apps (trainer-apply, event-apply) currently use direct `fetch()` for form submission — this is acceptable for simple one-off POST requests with file uploads.
- **Three response envelope types** exist in the backend — always verify which one a given endpoint uses:
  1. **`api_response()` wrapper**: `{ success: bool, message: string, statusCode: number, timestamp: string, data: T }` — Used by most custom admin views (moderation, events, studio, notifications, etc.). The actual data is nested inside `data`.
  2. **DRF pagination**: `{ count: number, next: string|null, previous: string|null, results: T[] }` — Used by DRF ViewSets (users, bookings, fitness records, etc.). Data is at the top level.
  3. **Admin login**: `{ message, access, refresh, user }` — Flat structure.
- **Auto-unwrapping**: The API client has a response interceptor that automatically unwraps `api_response()` envelopes. When the backend returns `{ success: true, data: T }`, the interceptor extracts `data` so all `api.get/post/put/del` methods return `T` directly. No manual unwrapping is needed in view code.
  - The interceptor only fires when `success === true` AND `data` key exists — error responses and non-wrapped endpoints pass through untouched.
  - The `login()` method re-wraps the response in `{ data }` to maintain backward compatibility with the auth context.
- Always type API responses with the correct TypeScript interfaces.
- Dashboard apps have centralized API wrappers:
  - Admin: `src/lib/admin-api.ts` with `createAdminApi(api)` factory, namespaced by domain (users, communities, moderation, studio, etc.).
  - Trainer: `src/lib/trainer-api.ts` with `trainerApi` namespace, methods take `api` as first param and use `unwrap()` to extract data.
- **Pagination contracts** — Two formats exist:
  - DRF standard: `{ count, next, previous, results: T[] }` (users, fitness, nutrition, etc.)
  - Custom offset: `{ total, offset, page_size, results: T[] }` (studio videos)

## 9. Authentication Patterns
Two auth patterns exist based on app type:

- **Dashboard apps (admin, trainer):** Wrap the app root with `<AuthProvider>` from `@holora/auth`. Use `useAuth()` hook for user state, API client, login/logout. Each app has its own `storagePrefix` (e.g., `"holora_admin"`, `"holora_trainer"`) to isolate tokens in localStorage.
- **Apply/form apps (trainer-apply, event-apply):** Use `useTokenFromUrl()` hook from `@holora/auth`. Token is passed via URL query param `?token=<JWT>` from the Flutter mobile app. Token must be read from URL, removed from browser history via `history.replaceState`, stored in memory only (never localStorage), and discarded after form submission. If no valid token, show "Please open this form from the Holora app" message.

## 10. Error Handling & User Feedback
- Always handle API errors gracefully. Never show raw error messages, stack traces, or technical details to the user.
- **Dashboard apps:** Use `showToast(message, type)` passed as a prop to view components. Pattern: `showToast(err instanceof Error ? err.message : "Descriptive fallback", "error")`.
- **Apply apps:** Show inline error messages within the form using error state objects.
- Wrap all API calls in try-catch.
- For dashboard-style parallel loads, use `Promise.allSettled` and handle each result independently.

## 11. No Assumptions
- Never assume API contracts, field names, model structure, or endpoint behavior.
- Always read and verify the actual backend code (views, serializers, models, URLs) before implementing.
- Do not guess request/response formats — confirm them from the source.

## 12. TypeScript Strict Mode
- All code must be TypeScript with strict mode enabled.
- No `any` types unless absolutely necessary (and must be documented with a comment explaining why).
- All API responses, request payloads, and component props must be properly typed.
- Use `import type { ... }` for type-only imports.
- Interfaces are defined inline at the top of each component file, not in separate type files.

## 13. Independence of Apps
- Each app in `apps/` must be completely independent and deployable on its own.
- Apps must not import from other apps. Only from `packages/`.
- Shared code goes in `packages/`, not duplicated across apps.

## 14. State Management (React Hooks Only)
- State is managed exclusively with React hooks: `useState`, `useEffect`, `useCallback`, `useMemo`.
- **No Redux, Zustand, React Query, SWR, or any external state management library.**
- No form libraries (no React Hook Form, Formik, Zod, Yup). Forms use native React state with `onChange` handlers.
- **Dashboard apps:** Navigation is state-based (not URL routing). The parent shell component manages active section via `useState`, and views are rendered conditionally. Selected entity IDs are stored in parent state and passed down as props.
- **Apply apps:** Multi-step form state is a single object managed via `useState` with a `set(key, value)` helper. Step navigation is controlled by a `step` state variable.

## 15. View & Component Conventions

### Dashboard Views (admin, trainer)
- Every view in `src/components/views/` must be a `"use client"` component with a default export.
- Views are lazy-loaded via `React.lazy(() => import("./views/xyz-view"))` and rendered inside `<Suspense fallback={<Spinner />}>`.
- Standard props interface:
  ```typescript
  interface ViewProps {
    api: ApiClient;
    showToast: (message: string, type: "success" | "error") => void;
    onBack?: () => void;
  }
  ```
- Views define inline helper components (Modal, ConfirmModal, TableWrap, TR, TD) — these are per-view, not shared.
- Navigation config is centralized in `src/lib/nav-config.ts` with `NAV` items and `GROUPS` arrays.
- To add a new section: (1) add entry to `NAV` in `nav-config.ts`, (2) add lazy import in the main app component, (3) add case to `renderView()` switch.
- Icons come from `lucide-react` only. Never use other icon libraries.

### Multi-Step Forms (trainer-apply, event-apply)
- Forms are single large components containing all step logic, validation, and submission.
- Steps are defined as a `STEPS` array with `{ id, label }` entries.
- Validation runs per-step via a `validate(step)` function that returns an errors object.
- Form components (Field, FInput, FTextarea, SearchSelect, FileUploadBox, ProgressBar) live in `src/components/form/`.
- Success screen is rendered inline after successful submission with a confirmation message and reference details.

### General
- View/component files are intentionally large (400–1800+ lines) containing full logic, inline types, and sub-components. Do not split unless explicitly instructed.
- Within a file, organize code: directives → imports → types → constants → inline helpers → main component.
- All components are functional. No class components.

## 16. Table Pattern (Dashboard Apps)
When displaying tabular data, use the inline helper pattern:
- `TableWrap({ cols, children })` — wraps a `<table>` with rounded border, column headers styled with `BRAND.panelLight` background.
- `TR({ children })` — table row with `border-t`, hover effect `hover:bg-black/20`.
- `TD({ children })` — table cell with padding, text color `BRAND.textMain`.
- Support checkboxes for multi-select, bulk actions, inline action buttons, search/filter bars, and pagination.

## 17. Modal Pattern (Dashboard Apps)
Modals are inline per-view components, NOT shared. Two variants:
1. **Modal** — Full modal with title bar, close button (X icon), scrollable body. Uses `BRAND.panel` background, `BRAND.panelLight` borders, `backdrop-blur-sm` overlay with `bg-black/70`, `z-50`.
2. **ConfirmModal** — Compact confirmation with message text and Cancel/Confirm buttons.

Modal visibility is controlled via `useState`. Render conditionally:
```typescript
{editItem && <EditModal ... />}
{confirmDel && <ConfirmModal ... />}
```

## 18. Styling Conventions
- **Tailwind CSS v4** for layout, spacing, responsive utilities, and typography sizing.
- **Inline `style={{ }}`** with `BRAND` tokens for all color-related styling.
- Responsive design uses Tailwind breakpoints (`md:`, `lg:`, `xl:`) for layout. Apply apps also use a window width hook with `isMobile` / `isTablet` flags for conditional rendering.
- Global CSS is minimal (`globals.css` imports Tailwind only). Some apps inject custom scrollbar or glow styles via `<style>` tags.
- Use `cn()` from `@holora/utils` for conditional class name merging (wraps clsx + tailwind-merge).

### Animation Conventions (Framer Motion)
- **Framer Motion** is installed in the admin app. Use `motion.div` with variants for entrance animations.
- **Standard `fadeUp` variant** for staggered section reveals:
  ```typescript
  const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.06, duration: 0.4, ease },
    }),
  };
  ```
  Usage: `<motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">`
- **Page transitions**: Use `AnimatePresence` with `mode="wait"` in the shell component to animate view switches.
- **Hover effects**: Use `whileHover={{ scale: 1.02 }}` for interactive cards.
- **Ease values must be typed as tuples** (`as [number, number, number, number]`) to satisfy Framer Motion's TypeScript types.
- **Skeleton loading**: Replace `<Spinner />` with skeleton components that match the layout structure when loading large data (dashboards, stat pages).

## 19. No Internationalization
- All web apps are **English-only**. Do not add i18n, localization, or translation infrastructure.
- Hardcoded English strings are acceptable and expected.
- This differs from the Flutter app (which uses ARB files). Do not apply Flutter localization patterns here.

## 20. File Uploads
- **Apply apps:** Use `FormData` with `multipart/form-data` content type for file submissions. Validate file size client-side (10MB max).
- **Dashboard apps:** Use `api.postFormData<T>()` from the API client for file uploads.
- Always show upload progress or loading state during file uploads.
- Generate local previews via `URL.createObjectURL()` for immediate user feedback.

## 21. Optimistic Updates & UI Sync
- For actions like approve/reject/delete/toggle in dashboard apps, update the UI state immediately (optimistic update) before the API response.
- Revert the UI state if the API call fails.
- After any create, update, or delete action, refresh the relevant data so the user sees the change immediately.

## 22. Backend Admin Endpoint Reference
Key admin endpoint patterns — always verify against the actual backend code before integrating:
- **Standard admin**: `/admin/users/`, `/admin/communities/`, `/admin/moderation/stats/` — most use `api_response()` wrapper
- **Trainer admin**: `/admin/trainer-dashboard/stats/` (NOT `/admin/trainers/dashboard-stats/`), `/admin/trainer-applications/`
- **Studio/Video moderation**: `/admin/studio/videos/` (list, detail, approve, reject, retrigger, bulk-action), `/admin/studio/reports/`, `/admin/studio/appeals/`
  - Approve/Reject use **POST** (not PATCH)
  - Suspend uploads: **POST** to suspend, **DELETE** to unsuspend
  - Videos use UUID IDs, appeals use integer IDs
- **Shop admin**: `/admin-shop/` prefix (NOT `/admin/shop/`)
- **Bookings/Trainers**: Direct DRF responses (no `api_response()` wrapper)

## 23. Environment Variables
- `NEXT_PUBLIC_API_URL` — Backend API base URL, set per app in `.env.local`.
- Default: `http://localhost:8000/HoloraPerformance` (admin) or appropriate base path.
- Never commit `.env.local` files. Use `.env.example` for documentation.

## 24. Responsive Design & Screen Compatibility
Every page, component, and layout MUST work flawlessly across all screen sizes and device types. No exceptions.

### Breakpoint System (Tailwind CSS v4)
- **Mobile-first approach** — write base styles for mobile, then layer up with breakpoints.
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px).
- **Dashboard apps** (admin, trainer): Minimum supported width is `md` (768px tablet). Sidebar collapses to hamburger menu on smaller screens. Tables become horizontally scrollable (`overflow-x-auto`). Grid layouts shift from multi-column to single-column.
- **Apply/form apps** (trainer-apply, event-apply): Must be fully usable on mobile (320px and up). These are opened from the Flutter app's in-app browser — assume phone-first.
- **Desktop**: Support up to ultra-wide (2560px+). Use `max-w-7xl` or similar containers to prevent content from stretching too wide. Center content on large screens.

### Layout Rules
- Use CSS Flexbox (`flex`, `flex-col`, `flex-wrap`) and CSS Grid (`grid`, `grid-cols-*`) for all layouts. Never use floats or absolute positioning for layout structure.
- Prefer `gap-*` over margins for spacing between flex/grid children.
- Use `min-h-screen` on the root layout container. Use `flex-1` for main content areas to fill remaining vertical space.
- Sidebar + content layouts: sidebar has fixed width on desktop (`w-64`), content area uses `flex-1 overflow-auto`.
- Cards and panels: use `w-full` with responsive `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` grids.
- Forms: max-width containers (`max-w-lg`, `max-w-xl`) centered on large screens, full-width on mobile.
- Use `overflow-x-auto` on all table wrappers so tables scroll horizontally on small screens rather than breaking layout.
- Never use fixed pixel widths on containers that should be fluid. Use `w-full`, `max-w-*`, or percentage-based widths.

### Touch & Mobile Interaction
- All interactive elements must have a minimum touch target of 44x44px (Apple HIG) / 48x48dp (Material).
- Add `touch-action: manipulation` on interactive elements to prevent 300ms tap delay on mobile browsers.
- Use `hover:` styles only as progressive enhancement — never rely on hover for critical functionality. Always pair with `focus:` and `active:` states.
- Swipeable carousels and sliders must work with touch gestures (use Embla Carousel or Swiper which handle this natively).
- Test modals and dropdowns on mobile — ensure they don't overflow the viewport and can be dismissed easily.

### Responsive Typography & Spacing
- Use Tailwind responsive text sizing: `text-sm md:text-base lg:text-lg` for body, `text-xl md:text-2xl lg:text-3xl` for headings.
- Use responsive padding: `p-4 md:p-6 lg:p-8` for page content areas.
- Use responsive gap: `gap-3 md:gap-4 lg:gap-6` for grid/flex layouts.
- Never use fixed pixel font sizes in inline styles for text that should scale responsively.

### Images & Media
- Always include `width` and `height` attributes (or aspect-ratio) on images to prevent Cumulative Layout Shift (CLS).
- Use Next.js `<Image>` component with `sizes` prop for responsive image loading.
- Use `object-fit: cover` / `object-fit: contain` for images in fixed containers.
- Provide appropriate image sizes for different breakpoints via `srcSet` or Next.js `sizes`.

## 25. Cross-Browser Compatibility
All apps must work correctly on the following browsers. Test and verify.

### Supported Browsers
| Browser | Platform | Min Version | Priority |
|---------|----------|-------------|----------|
| **Chrome** | Desktop, Android | Last 2 versions | Primary |
| **Safari** | macOS, iOS | 15.4+ | Primary |
| **Firefox** | Desktop | Last 2 versions | Secondary |
| **Edge** | Desktop | Last 2 versions | Secondary |
| **Samsung Internet** | Android | Last 2 versions | Secondary |
| **In-app WebView** | iOS (WKWebView), Android (Chrome Custom Tabs) | — | Critical (apply apps) |

### Safari-Specific Rules (Critical)
Safari has the most rendering differences. Always account for:
- **`-webkit-` prefixes**: Tailwind handles most, but for custom CSS use `-webkit-backdrop-filter` alongside `backdrop-filter`, `-webkit-overflow-scrolling: touch` for smooth scroll containers.
- **`dvh` units**: Use `min-h-[100dvh]` instead of `min-h-screen` for full-height layouts on iOS Safari (accounts for address bar). Tailwind v4 supports `dvh` natively.
- **Safe area insets**: For apply apps opened in iOS in-app browser, use `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)` padding to avoid content hidden behind notch or home indicator. In Tailwind: `pb-[env(safe-area-inset-bottom)]`.
- **`position: fixed`** behaves differently on iOS Safari inside scrollable containers. Prefer `position: sticky` where possible. For modals, ensure the body scroll is locked.
- **`100vh` bug**: On iOS Safari, `100vh` includes the address bar area. Always use `100dvh` or the `window.innerHeight` JS fallback.
- **Smooth scrolling**: `scroll-behavior: smooth` is inconsistent on Safari. Use Lenis for cross-browser smooth scrolling.
- **Date inputs**: Native `<input type="date">` renders differently on Safari. Use React Day Picker for consistent date selection UI.
- **`gap` in Flexbox**: Fully supported in Safari 14.1+. Safe to use.

### CSS Feature Checks
- **Always safe to use**: Flexbox, Grid, `gap`, CSS custom properties, `clamp()`, `min()`/`max()`, `aspect-ratio`, `backdrop-filter` (with `-webkit-` prefix), `overflow: clip`, Container Queries (Safari 16+).
- **Use with caution**: `:has()` selector (Safari 15.4+, Chrome 105+), `@layer` (Safari 15.4+), Subgrid (Safari 16+), `color-mix()` (Safari 16.2+).
- **Avoid**: CSS Nesting without a PostCSS plugin (inconsistent support), `text-wrap: balance` (limited support).

### JavaScript Compatibility
- Target ES2020 (as set in `tsconfig.base.json`). This covers all supported browsers.
- Use `ResizeObserver` instead of `window.resize` for element-level resize detection (supported in all target browsers).
- Use `IntersectionObserver` for scroll-triggered lazy loading and animations.
- Use `navigator.clipboard` API for copy-to-clipboard (requires HTTPS, falls back gracefully).
- Never use `window.orientation` (deprecated) — use `screen.orientation` or media queries.

### Testing Checklist
Before considering any page or component complete, verify:
- [ ] Chrome desktop (latest) — primary development browser
- [ ] Safari desktop (latest) — catch WebKit rendering differences
- [ ] Mobile Chrome (Android) — touch interactions, responsive layout
- [ ] Mobile Safari (iOS) — viewport height, safe areas, in-app WebView
- [ ] Firefox desktop — fallback verification
- [ ] Screen sizes: 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1024px (iPad landscape), 1280px (laptop), 1920px (desktop), 2560px (ultra-wide)

## 26. UI Performance Optimization
Every page must feel instant. Target: First Contentful Paint < 1.5s, Largest Contentful Paint < 2.5s, Cumulative Layout Shift < 0.1, Interaction to Next Paint < 200ms.

### Rendering Performance
- **Minimize re-renders**: Use `React.memo()` for components that receive stable props but sit inside frequently-updating parents. Use `useMemo` for expensive derived data. Use `useCallback` for functions passed as props to child components.
- **Virtualize long lists**: Any list or table with 50+ rows MUST use `TanStack Virtual` or `React Virtuoso`. Never render hundreds of DOM nodes at once.
- **Lazy load views**: All dashboard views are already lazy-loaded via `React.lazy()`. Any new heavy component (charts, 3D, rich text editors) must also be lazy-loaded.
- **Debounce search inputs**: Any search/filter input that triggers API calls or heavy filtering must be debounced (300ms minimum). Use a simple `setTimeout`/`clearTimeout` pattern or `useDeferredValue`.
- **Avoid layout thrashing**: Never read DOM measurements (offsetHeight, getBoundingClientRect) and then immediately write styles in the same synchronous block. Batch reads and writes separately.
- **`will-change`**: Use sparingly and only on elements that are actively animating. Remove after animation completes. Never apply globally.

### Bundle Size
- **Tree-shake imports**: Import only what you need. Use `import { Button } from "@holora/ui"` not `import * as UI from "@holora/ui"`. For icon libraries: `import { Search } from "lucide-react"` not the entire library.
- **Lazy load heavy libraries**: Charts (ECharts, Nivo), 3D (Three.js), rich text editors (TipTap), and animation libraries (GSAP) must be dynamically imported when needed, not in the main bundle.
  ```typescript
  const EChartsComponent = lazy(() => import("./charts/echarts-wrapper"));
  ```
- **Analyze bundle**: Use `next build` with `ANALYZE=true` (via `@next/bundle-analyzer`) to identify large dependencies. No single page's JS bundle should exceed 200KB gzipped.
- **No duplicate dependencies**: In the monorepo, shared dependencies must be hoisted. Never install the same library in multiple apps — put it in the relevant shared package or hoist to root.

### Network Performance
- **Paginate all list APIs**: Never load all records at once. Default page size: 20–50 items.
- **Parallel API calls**: Use `Promise.allSettled()` for dashboard initial loads that fetch multiple independent endpoints.
- **Cache API responses**: For data that rarely changes (constants, categories, user profile), cache in component state and avoid refetching on every view switch.
- **Prefetch on hover**: For navigation items, consider prefetching the next view's data on hover/focus to make transitions feel instant.
- **Compress images**: Use WebP/AVIF formats via Next.js `<Image>` component. Set appropriate `quality` (75–85 for photos, higher for UI screenshots).

### Animation Performance
- **Use `transform` and `opacity` for animations** — these are GPU-accelerated and don't trigger layout/paint. Avoid animating `width`, `height`, `top`, `left`, `margin`, `padding`.
- **Use Framer Motion's `layout` prop** for layout animations instead of manually animating position/size.
- **60fps target**: All animations must run at 60fps. If an animation drops below 60fps on a mid-range device, simplify it or remove it.
- **`prefers-reduced-motion`**: Respect the user's OS-level reduced motion preference. Wrap all non-essential animations:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- **Disable heavy effects on mobile**: Particle effects (tsParticles), 3D scenes (Three.js), and complex scroll animations should be disabled or simplified on devices with `width < 768px` or when `prefers-reduced-motion` is set.

### Loading States & Perceived Performance
- **Skeleton screens**: For dashboard views, show skeleton placeholders (not just spinners) while data loads. Skeletons should match the approximate layout of the final content.
- **Optimistic UI**: Update the UI immediately on user actions (Rule 21). Show a subtle loading indicator for the background API call.
- **Progressive loading**: Load critical above-the-fold content first. Defer below-the-fold charts, tables, and media.
- **Smooth transitions**: Use Framer Motion `AnimatePresence` for enter/exit transitions between views. Avoid jarring content jumps.

### Accessibility Performance
- **Focus management**: After navigation or modal open, move focus to the appropriate element. Use `tabIndex={-1}` and `ref.focus()` for programmatic focus.
- **Keyboard navigation**: All interactive elements must be reachable via Tab key. All actions must be triggerable via Enter or Space. Modals must trap focus.
- **Color contrast**: All text must meet WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text) against its background. Verify BRAND token combinations.
- **Screen reader support**: Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`). Add `aria-label` on icon-only buttons. Use `role="alert"` on toast notifications.
- **Reduced motion**: Always check `prefers-reduced-motion` before applying animations (see above).

## 27. Approved Open-Source Libraries
The following libraries are approved for use across all apps. All are free and open-source (MIT/Apache/ISC/BSD). When a feature is needed, **always prefer these over alternatives**. Do not introduce libraries outside this list without explicit approval.

### UI Components
| Library | Use For | License |
|---------|---------|---------|
| **Shadcn UI** | Buttons, cards, dialogs, tables, forms, sidebar, command palette, calendar, dropdowns, menus | MIT |
| **Magic UI** | Aurora backgrounds, dock, meteors, marquee, animated borders, animated text, globe, bento grid, terminal, shine effects, ripple, hero sections | MIT |
| **Aceternity UI** | Hero spotlight, background beams, infinite cards, hover cards, canvas reveal, Apple-style cards, wavy backgrounds, sticky scroll, lamp effect | MIT |
| **Origin UI** | 300+ production-ready components for rapid development | MIT |

### Animation
| Library | Use For | License |
|---------|---------|---------|
| **Framer Motion** | Page transitions, shared layout animations, hover/drag/gesture effects, scroll animations, reveal animations | MIT |
| **GSAP** | Timeline animations, SVG animations, scroll-triggered effects, text animations, morphing, physics-based motion | Standard Free |
| **Motion One** | Lightweight alternative to GSAP for simple animations | MIT |
| **Anime.js** | SVG animation, icon animation, text effects | MIT |

### Smooth Scrolling
| Library | Use For | License |
|---------|---------|---------|
| **Lenis** | Smooth page scrolling (preferred over Locomotive Scroll) | MIT |
| **React Scroll Parallax** | Parallax scroll effects | MIT |
| **AOS (Animate On Scroll)** | Scroll-triggered element animations | MIT |

### Background & Special Effects
| Library | Use For | License |
|---------|---------|---------|
| **tsParticles** | Snow, rain, fireworks, galaxy, stars, smoke, confetti particle effects | MIT |
| **Vanta.js** | Animated backgrounds (birds, waves, clouds, dots, globe, rings, fog) | MIT |

### Charts & Data Visualization
| Library | Use For | License |
|---------|---------|---------|
| **Apache ECharts** | Line, area, bar, pie, radar, funnel, gauge, heatmap, tree, treemap, sankey, candlestick, network graph, timeline, calendar, geo maps — most powerful option | Apache 2.0 |
| **Nivo** | Beautiful dashboard charts (stream, tree, chord, circle packing, calendar, heatmap, radar) | MIT |
| **Recharts** | Simple React-friendly charts | MIT |
| **Visx** | Custom low-level visualizations (from Airbnb) | MIT |
| **D3.js** | Fully custom data visualizations when maximum control is needed | BSD-3 |

### Data Tables
| Library | Use For | License |
|---------|---------|---------|
| **TanStack Table** | Sorting, filtering, grouping, virtualization, pagination, column pinning | MIT |

### Dashboard Components
| Library | Use For | License |
|---------|---------|---------|
| **Tremor** | KPI cards, chart wrappers, analytics layouts, metrics, pre-built dashboard components | MIT |

### Carousel & Sliders
| Library | Use For | License |
|---------|---------|---------|
| **Embla Carousel** | Lightweight, highly customizable carousels (preferred) | MIT |
| **Swiper** | Production-ready sliders with touch support | MIT |

### Notifications
| Library | Use For | License |
|---------|---------|---------|
| **Sonner** | Beautiful toast notifications (preferred over react-hot-toast) | MIT |

### Dialogs & Floating Elements
| Library | Use For | License |
|---------|---------|---------|
| **Radix UI** | Accessible dialogs, popovers, dropdowns, tooltips, primitives | MIT |
| **Floating UI** | Tooltips, popovers, dropdowns with smart positioning | MIT |

### Drag & Drop
| Library | Use For | License |
|---------|---------|---------|
| **DnD Kit** | Sortable lists, kanban boards, drag-and-drop interfaces | MIT |

### Forms & Validation
| Library | Use For | License |
|---------|---------|---------|
| **React Hook Form** | Performant form state management with minimal re-renders | MIT |
| **Zod** | Schema-based form validation and TypeScript type inference | MIT |

### Search & Command
| Library | Use For | License |
|---------|---------|---------|
| **CMDK** | Command palette / spotlight search UI | MIT |
| **Fuse.js** | Client-side fuzzy search | Apache 2.0 |

### Rich Text Editors
| Library | Use For | License |
|---------|---------|---------|
| **TipTap** | Professional rich text editing with extensions | MIT |
| **Lexical** | High-performance text editing (from Meta) | MIT |
| **EditorJS** | Block-style content editing | Apache 2.0 |

### File Upload
| Library | Use For | License |
|---------|---------|---------|
| **Uppy** | Drag-and-drop, S3 uploads, progress, resumable, multipart | MIT |
| **React Dropzone** | Simple drag-and-drop file input | MIT |

### Maps
| Library | Use For | License |
|---------|---------|---------|
| **Leaflet** | Interactive maps | BSD-2 |
| **MapLibre GL** | Vector tile maps (open-source Mapbox alternative) | BSD-3 |

### 3D & Interactive Graphics
| Library | Use For | License |
|---------|---------|---------|
| **Three.js** | 3D scenes, product viewers, WebGL rendering | MIT |
| **React Three Fiber** | React wrapper for Three.js | MIT |
| **Drei** | Helpers for React Three Fiber (camera, lighting, models, effects) | MIT |
| **Theatre.js** | Professional animation timeline for 3D scenes | MIT |

### Video & Media
| Library | Use For | License |
|---------|---------|---------|
| **Plyr** | Clean video/audio player UI | MIT |
| **Video.js** | Full-featured video player | Apache 2.0 |
| **HLS.js** | HTTP Live Streaming playback | Apache 2.0 |

### Image Gallery
| Library | Use For | License |
|---------|---------|---------|
| **PhotoSwipe** | Lightbox image galleries with zoom/swipe | MIT |

### Calendar
| Library | Use For | License |
|---------|---------|---------|
| **React Day Picker** | Date selection UI | MIT |

### Color Picker
| Library | Use For | License |
|---------|---------|---------|
| **React Colorful** | Lightweight color picker | MIT |

### Performance & Virtualization
| Library | Use For | License |
|---------|---------|---------|
| **TanStack Virtual** | Virtualized lists and grids for large datasets | MIT |
| **React Virtuoso** | Virtualized scrolling with grouping support | MIT |

### CSS Effects
| Library | Use For | License |
|---------|---------|---------|
| **Animate.css** | Pre-built CSS animation classes | MIT |
| **Hover.css** | CSS hover effects collection | MIT |

### Icons (Beyond Lucide)
| Library | Use For | License |
|---------|---------|---------|
| **Lucide React** | Primary icon library (already in use) | ISC |
| **Heroicons** | Alternative icon set (from Tailwind team) | MIT |
| **Phosphor Icons** | Flexible icon family with multiple weights | MIT |
| **Tabler Icons** | 5000+ open-source icons | MIT |

### Libraries to AVOID
Do not use these — they conflict with the project's architecture or are redundant:
- **Material UI (MUI)** — Heavy, opinionated, conflicts with Tailwind + BRAND tokens.
- **Ant Design** — Large bundle size, design language conflicts.
- **Chakra UI** — Redundant with Tailwind + Shadcn.
- **Bootstrap** — Conflicts with Tailwind.
- **jQuery-based plugins** — No jQuery in this project.
- **Locomotive Scroll** — Use Lenis instead (better maintained, smoother).
- **Redux / Zustand / MobX** — Contradicts Rule 14 (React hooks only for state).
