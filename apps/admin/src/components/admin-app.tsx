"use client";

import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@holora/auth";
import { Spinner, Sidebar, useToast, Toast, BRAND } from "@holora/ui";
import { Bell, Search, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { LoginView } from "./login-view";
import { ErrorBoundary } from "./error-boundary";
import { NAV, GROUPS } from "@/lib/nav-config";
import { createAdminApi } from "@/lib/admin-api";

// Lazy-load view components
const DashboardView = lazy(() => import("./views/dashboard-view"));
const UsersView = lazy(() => import("./views/users-view"));
const UserDetailView = lazy(() => import("./views/user-detail-view"));
const CommunitiesView = lazy(() => import("./views/communities-view"));
const CommunityDetailView = lazy(() => import("./views/community-detail-view"));
const ModerationView = lazy(() => import("./views/moderation-view"));
const EventsView = lazy(() => import("./views/events-view"));
const EventDetailView = lazy(() => import("./views/event-detail-view"));
const FitnessView = lazy(() => import("./views/fitness-view"));
const NutritionView = lazy(() => import("./views/nutrition-view"));
const RecoveryView = lazy(() => import("./views/recovery-view"));
const TrainersView = lazy(() => import("./views/trainers-view"));
const TrainerDetailView = lazy(() => import("./views/trainer-detail-view"));
const TrainerAppDetailView = lazy(() => import("./views/trainer-app-detail-view"));
const StudioView = lazy(() => import("./views/studio-view"));
const ContentView = lazy(() => import("./views/content-view"));
const ShopView = lazy(() => import("./views/shop-view"));
const ShopConfigView = lazy(() => import("./views/shop-config-view"));
const NotificationsView = lazy(() => import("./views/notifications-view"));
const FinanceView = lazy(() => import("./views/finance-view"));
const TrainerEarningsView = lazy(() => import("./views/trainer-earnings-view"));
const SubscriptionsView = lazy(() => import("./views/subscriptions-view"));
const PricingView = lazy(() => import("./views/pricing-view"));
const AuditView = lazy(() => import("./views/audit-view"));
const AlertsView = lazy(() => import("./views/alerts-view"));
const DatasetsView = lazy(() => import("./views/datasets-view"));

export function AdminApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <DashboardShell />;
}

function DashboardShell() {
  const { user, api, logout } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [section, setSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [pendingReports, setPendingReports] = useState(0);

  const adminApi = useMemo(() => createAdminApi(api), [api]);

  // Responsive: collapse sidebar on smaller screens
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1200px)");
    const update = () => {
      setSidebarCollapsed(!desktop.matches);
    };
    update();
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, []);

  const handleSelect = (id: string) => {
    setSection(id);
    setSelectedUserId(null);
    setSelectedAppId(null);
    setSelectedCommunityId(null);
    setSelectedEventId(null);
    setSelectedTrainerId(null);
  };

  const viewProps = {
    api,
    showToast,
    onSelectUser: (id: string) => { setSelectedUserId(id); setSection("user-detail"); },
    onSelectApp: (id: string) => { setSelectedAppId(id); setSection("trainer-app-detail"); },
    onSelectCommunity: (id: string) => { setSelectedCommunityId(id); setSection("community-detail"); },
    onSelectEvent: (id: string) => { setSelectedEventId(id); setSection("event-detail"); },
    onSelectTrainer: (id: string) => { setSelectedTrainerId(id); setSection("trainer-detail"); },
    onSetPendingReports: setPendingReports,
    onBack: () => { setSection(section === "user-detail" ? "users" : section === "community-detail" ? "communities" : section === "event-detail" ? "events" : section === "trainer-app-detail" ? "trainers" : section === "trainer-detail" ? "trainers" : "dashboard"); },
  };

  const renderView = () => {
    switch (section) {
      case "dashboard": return <DashboardView {...viewProps} />;
      case "users": return <UsersView {...viewProps} />;
      case "user-detail": return <UserDetailView {...viewProps} userId={selectedUserId!} />;
      case "communities": return <CommunitiesView {...viewProps} />;
      case "community-detail": return <CommunityDetailView {...viewProps} communityId={selectedCommunityId!} />;
      case "moderation": return <ModerationView {...viewProps} />;
      case "events": return <EventsView {...viewProps} />;
      case "event-detail": return <EventDetailView {...viewProps} eventId={selectedEventId!} />;
      case "fitness": return <FitnessView {...viewProps} />;
      case "nutrition": return <NutritionView {...viewProps} />;
      case "recovery": return <RecoveryView {...viewProps} />;
      case "trainers": return <TrainersView {...viewProps} />;
      case "trainer-detail": return <TrainerDetailView {...viewProps} trainerId={selectedTrainerId!} />;
      case "trainer-app-detail": return <TrainerAppDetailView {...viewProps} appId={selectedAppId!} />;
      case "studio": return <StudioView {...viewProps} />;
      case "content": return <ContentView {...viewProps} />;
      case "shop": return <ShopView {...viewProps} />;
      case "shop-config": return <ShopConfigView {...viewProps} />;
      case "notifications": return <NotificationsView {...viewProps} />;
      case "finance": return <FinanceView {...viewProps} />;
      case "trainer-earnings": return <TrainerEarningsView {...viewProps} />;
      case "subscriptions": return <SubscriptionsView {...viewProps} />;
      case "pricing": return <PricingView {...viewProps} />;
      case "audit": return <AuditView {...viewProps} />;
      case "alerts": return <AlertsView {...viewProps} />;
      case "datasets": return <DatasetsView {...viewProps} />;
      default: return <DashboardView {...viewProps} />;
    }
  };

  const initials = (user?.name?.[0] || user?.email?.[0] || "A").toUpperCase();
  const sectionLabel = NAV.find((n) => n.id === section)?.label || section.replace(/-/g, " ");

  return (
    <div className="h-[100dvh] flex overflow-hidden text-white font-sans" style={{ background: "radial-gradient(circle at top right, #0f172a, #020617)" }}>
      <Toast message={toast.message} type={toast.type} onClose={hideToast} />

      {/* SIDEBAR — always static flex child */}
      <Sidebar
        nav={NAV}
        groups={GROUPS}
        active={section}
        onSelect={handleSelect}
        onLogout={logout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        badges={{ moderation: pendingReports }}
        mode="static"
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP BAR */}
        <header
          className="h-14 flex items-center justify-between px-4 sm:px-6 shrink-0"
          style={{
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(30, 41, 59, 0.5)",
          }}
        >
          <div className="flex items-center gap-2">
            {/* Collapse/expand toggle */}
            <button
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            {/* Breadcrumb / page title */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <span className="text-slate-500">Admin</span>
              <span className="text-slate-600">/</span>
              <span className="text-white font-medium capitalize">{sectionLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative w-64 hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search... (⌘K)"
                className="w-full rounded-lg pl-8 pr-4 py-1.5 text-sm text-white placeholder-slate-500 outline-none"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(51, 65, 85, 0.4)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(126,34,206,0.5)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(51, 65, 85, 0.4)"; }}
              />
            </div>

            {/* Notifications */}
            <button className="relative text-slate-400 hover:text-white transition p-2 rounded-lg hover:bg-white/5" aria-label="Notifications">
              <Bell size={18} />
              {pendingReports > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" style={{ border: "2px solid #0f172a" }} />
              )}
            </button>

            <div className="h-5 w-px bg-slate-800" />

            {/* User */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-400">
                {initials}
              </div>
              <div className="text-sm hidden sm:block">
                <p className="font-medium text-white leading-none">
                  {user?.name || user?.email?.split("@")[0] || "Admin"}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {user?.role || "admin"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ErrorBoundary>
                <Suspense fallback={<Spinner />}>
                  {renderView()}
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
