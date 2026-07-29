import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import adminApi from "../services/adminApi";
import BRAND from "../constants/brand";
import { Toast } from "../components/ui";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import LoginView from "../modules/auth/LoginView";
import DashboardView from "../modules/dashboard/DashboardView";
import UsersView from "../modules/users/UsersView";
import UserDetailView from "../modules/users/UserDetailView";
import CommunitiesView from "../modules/communities/CommunitiesView";
import ModerationView from "../modules/moderation/ModerationView";
import EventsView from "../modules/events/EventsView";
import FitnessView from "../modules/fitness/FitnessView";
import NutritionView from "../modules/nutrition/NutritionView";
import RecoveryView from "../modules/recovery/RecoveryView";
import TrainersView from "../modules/trainers/TrainersView";
import TrainerAppDetailView from "../modules/trainers/TrainerAppDetailView";
import FinanceView from "../modules/finance/FinanceView";
import NotificationsView from "../modules/notifications/NotificationsView";
import ShopView from "../modules/shop/ShopView";
import ContentView from "../modules/content/ContentView";
import SubscriptionsView from "../modules/subscriptions/SubscriptionsView";
import PricingView from "../modules/pricing/PricingView";
import AuditView from "../modules/audit/AuditView";
import AlertsView from "../modules/alerts/AlertsView";
import DatasetsView from "../modules/datasets/DatasetsView";

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("admin_access_token") || "");
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("admin_user") || "null"); } catch { return null; } });
  const [section, setSection] = useState("dashboard");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [pendingReports, setPendingReports] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 4000);
  }

  function handleLogin(t, u) {
    localStorage.setItem("admin_access_token", t);
    localStorage.setItem("admin_user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  }

  function handleLogout() {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user");
    setToken("");
    setUser(null);
  }

  const authedShowToast = useCallback((msg, type) => {
    if (type === "error" && msg) {
      const lower = msg.toLowerCase();
      const is401 =
        msg === "HTTP 401" ||
        lower === "unauthorized" ||
        lower.includes("token is invalid or expired") ||
        lower.includes("token not valid") ||
        lower.includes("credentials were not provided");
      if (is401) { handleLogout(); return; }
    }
    showToast(msg, type);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!token) return;
    adminApi.moderation.stats(token)
      .then(r => setPendingReports(r?.total_reports_pending || 0))
      .catch(() => { });
  }, [token, section]);

  if (!token) return <LoginView onLogin={handleLogin} />;

  function navigate(s) {
    setSection(s);
    if (s !== "users") setSelectedUserId(null);
    if (s !== "trainers") setSelectedAppId(null);
  }

  const viewProps = { token, showToast: authedShowToast };

  return (
    <div className="min-h-screen flex w-full" style={{ backgroundColor: BRAND.bg }}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
      <Sidebar
        active={section}
        onSelect={navigate}
        pendingReports={pendingReports}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header section={section} pendingReports={pendingReports} user={user} onMenuClick={() => setSidebarOpen(true)} />
        <div key={section} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar animation-fade-in">
          {section === "dashboard" && <DashboardView {...viewProps} />}
          {section === "users" && !selectedUserId && <UsersView {...viewProps} onSelectUser={setSelectedUserId} />}
          {section === "users" && selectedUserId && <UserDetailView {...viewProps} userId={selectedUserId} onBack={() => setSelectedUserId(null)} />}
          {section === "communities" && <CommunitiesView {...viewProps} />}
          {section === "moderation" && <ModerationView {...viewProps} />}
          {section === "events" && <EventsView {...viewProps} />}
          {section === "fitness" && <FitnessView {...viewProps} />}
          {section === "nutrition" && <NutritionView {...viewProps} />}
          {section === "recovery" && <RecoveryView {...viewProps} />}
          {section === "trainers" && !selectedAppId && <TrainersView {...viewProps} onSelectApp={setSelectedAppId} />}
          {section === "trainers" && selectedAppId && <TrainerAppDetailView {...viewProps} appId={selectedAppId} onBack={() => setSelectedAppId(null)} />}
          {section === "content" && <ContentView {...viewProps} />}
          {section === "shop" && <ShopView {...viewProps} />}
          {section === "notifications" && <NotificationsView {...viewProps} />}
          {section === "finance" && <FinanceView {...viewProps} />}
          {section === "subscriptions" && <SubscriptionsView {...viewProps} />}
          {section === "pricing" && <PricingView {...viewProps} />}
          {section === "audit" && <AuditView {...viewProps} />}
          {section === "alerts" && <AlertsView {...viewProps} />}
          {section === "datasets" && <DatasetsView {...viewProps} />}
        </div>
      </main>
    </div>
  );
}
