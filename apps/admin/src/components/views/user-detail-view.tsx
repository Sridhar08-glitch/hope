"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  Edit,
  Shield,
  ShieldAlert,
  Coins,
  Award,
  Flame,
  Dumbbell,
  Apple,
  HeartPulse,
  MessageCircle,
  Download,
  Database,
  KeyRound,
  Phone,
} from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import { motion } from "framer-motion";
import type { ApiClient } from "@holora/api-client";
import {
  TabBar,
  DataTable,
  TR,
  TD,
  Modal,
  StatCard,
  StatusBadge,
  fadeUp,
  cardStyle,
  subtleBorder,
} from "@/components/shared";

/* ── Types ─────────────────────────────────────────── */

interface UserDetail {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: string;
  is_active: boolean;
  fitness_goal?: string;
  fitness_level?: string;
  date_joined?: string;
  phone?: string;
  coin_balance?: number;
  xp?: number;
  streak?: number;
}

interface FitSummary {
  lifetime_stats?: Record<string, unknown>;
  best_day?: { date: string; steps: number; calories: number };
  last_7_days?: { date?: string; steps?: number; calories?: number; goal_completed?: boolean }[];
}

interface NutSummary {
  lifetime_stats?: Record<string, unknown>;
  current_plan?: { plan_name?: string };
}

interface RecSummary {
  session_stats?: Record<string, unknown>;
  wellness_averages?: Record<string, unknown>;
  favorite_recovery_types?: { name?: string; recovery_type_name?: string; count?: number; session_count?: number }[];
}

interface ModStatus {
  is_banned?: boolean;
  warning_count?: number;
  [key: string]: unknown;
}

interface CallRecord {
  id?: string;
  created_at?: string;
  call_type?: string;
  duration?: number;
  other_user?: { name?: string; email?: string };
  caller?: { name?: string };
  receiver?: { name?: string };
  status?: string;
}

interface UserDetailViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
  userId: string;
  onBack: () => void;
}

type Tab = "overview" | "fitness" | "recovery" | "social";

/* ── KV Row helper ─────────────────────────────────── */

function KVRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-[12px] py-1">
      <span style={{ color: BRAND.textDim }}>{label.replace(/_/g, " ")}</span>
      <span className="font-medium" style={{ color: BRAND.textMain }}>{value ?? "\u2014"}</span>
    </div>
  );
}

/* ── Main View ─────────────────────────────────────── */

export default function UserDetailView({ api, showToast, userId, onBack }: UserDetailViewProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [fitSummary, setFitSummary] = useState<FitSummary | null>(null);
  const [nutSummary, setNutSummary] = useState<NutSummary | null>(null);
  const [recSummary, setRecSummary] = useState<RecSummary | null>(null);
  const [modStatus, setModStatus] = useState<ModStatus | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [compData, setCompData] = useState<unknown>(null);
  const [showCompModal, setShowCompModal] = useState(false);
  const [callHistory, setCallHistory] = useState<CallRecord[] | null>(null);

  useEffect(() => {
    api.get<UserDetail>(`/admin/users/${userId}/`).then(setUser).catch((e: unknown) => showToast(e instanceof Error ? e.message : "Failed to load user", "error")).finally(() => setLoading(false));
    api.get<FitSummary>(`/admin/fitness/users/${userId}/summary/`).then(setFitSummary).catch(() => {});
    api.get<NutSummary>(`/admin/nutrition/users/${userId}/summary/`).then(setNutSummary).catch(() => {});
    api.get<RecSummary>(`/admin/recovery/users/${userId}/summary/`).then(setRecSummary).catch(() => {});
    api.get<ModStatus>(`/admin/moderation/users/${userId}/status/`).then(setModStatus).catch(() => {});
  }, [api, userId, showToast]);

  useEffect(() => {
    if (tab === "social")
      api.get<{ results?: CallRecord[] }>(`/admin/moderation/calls/users/${userId}/history/`).then(r => setCallHistory(r?.results || (r as unknown as CallRecord[]) || [])).catch(() => {});
  }, [tab, api, userId]);

  async function downloadReport() {
    try { const res = await api.get<Record<string, unknown>>(`/admin/users/${userId}/report/`); showToast("Report generated", "success"); if (res) { setCompData(res); setShowCompModal(true); } }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Report failed", "error"); }
  }

  async function loadComprehensive() {
    try { const res = await api.get(`/admin/users/${userId}/comprehensive/`); setCompData(res); setShowCompModal(true); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to load data", "error"); }
  }

  async function resetPassword() {
    if (!window.confirm("Send password reset to this user?")) return;
    try { await api.post(`/admin/users/${userId}/reset-password/`); showToast("Password reset sent", "success"); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Reset failed", "error"); }
  }

  async function impersonate() {
    try { const res = await api.post<{ access?: string; token?: string }>(`/admin/users/${userId}/impersonate/`); const t = res?.access || res?.token; if (t) { navigator.clipboard?.writeText(t); showToast("Impersonation token copied!", "success"); } }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Impersonation failed", "error"); }
  }

  async function warn() {
    try { await api.post(`/admin/moderation/users/${userId}/warn/`); showToast("User warned", "success"); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Warn failed", "error"); }
  }

  async function toggleBan() {
    try {
      if (modStatus?.is_banned) { await api.post(`/admin/moderation/users/${userId}/unban/`); showToast("User unbanned", "success"); }
      else { await api.post(`/admin/moderation/users/${userId}/ban/`); showToast("User banned", "success"); }
      api.get<ModStatus>(`/admin/moderation/users/${userId}/status/`).then(setModStatus).catch(() => {});
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Action failed", "error"); }
  }

  if (loading) return <Spinner />;
  if (!user) return <p className="text-[12px]" style={{ color: BRAND.error }}>User not found</p>;

  const contentTabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "fitness", label: "Fitness & Nutrition" },
    { key: "recovery", label: "Recovery" },
    { key: "social", label: "Social" },
  ];

  return (
    <div className="space-y-5 flex flex-col">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-md hover:bg-white/5 transition" aria-label="Back">
          <ChevronLeft size={18} style={{ color: BRAND.textMuted }} />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: BRAND.textMain }}>
            {user.first_name} {user.last_name}
            {user.role === "admin" && <StatusBadge status="admin" color={BRAND.primary} />}
            {user.role === "trainer" && <StatusBadge status="trainer" color={BRAND.warning} />}
          </h1>
          <p className="text-[10px] mt-0.5" style={{ color: BRAND.textDim }}>
            ID: {user.id} &middot; Joined: {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "\u2014"}
          </p>
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1">
        {/* LEFT SIDEBAR */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          {/* Profile Card */}
          <div className="rounded-xl p-5 text-center" style={cardStyle}>
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-3" style={{ backgroundColor: BRAND.primary, color: BRAND.accent }}>
              {(user.first_name?.[0] || "?").toUpperCase()}
            </div>
            <h2 className="text-[13px] font-semibold" style={{ color: BRAND.textMain }}>{user.first_name} {user.last_name}</h2>
            <p className="text-[11px] mt-0.5" style={{ color: BRAND.textDim }}>{user.email}</p>

            <div className="flex justify-center gap-1.5 mt-3 mb-4">
              <StatusBadge status={user.role} />
              <StatusBadge status={user.is_active ? "active" : "inactive"} />
              {modStatus?.is_banned && <StatusBadge status="banned" />}
            </div>

            <div className="grid grid-cols-2 gap-2 text-left pt-3" style={{ borderTop: subtleBorder }}>
              {([["Goal", user.fitness_goal], ["Level", user.fitness_level], ["Joined", user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "\u2014"], ["Phone", user.phone || "\u2014"]] as const).map(([l, v]) => (
                <div key={l}>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: BRAND.textDim }}>{l}</p>
                  <p className="text-[11px] font-medium" style={{ color: BRAND.textMain }}>{v || "\u2014"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="rounded-xl p-3 space-y-1.5" style={cardStyle}>
            {([
              { label: "Edit Profile", icon: Edit, onClick: () => {}, color: BRAND.textMuted },
              { label: "Impersonate", icon: Shield, onClick: impersonate, color: BRAND.textMuted },
              { label: "Warn User", icon: ShieldAlert, onClick: warn, color: BRAND.warning },
              { label: modStatus?.is_banned ? "Unban User" : "Ban User", icon: ShieldAlert, onClick: toggleBan, color: modStatus?.is_banned ? BRAND.success : BRAND.error },
              { label: "Reset Password", icon: KeyRound, onClick: resetPassword, color: BRAND.warning },
              { label: "Download Report", icon: Download, onClick: downloadReport, color: BRAND.info },
              { label: "Full User Data", icon: Database, onClick: loadComprehensive, color: BRAND.info },
            ] as const).map(({ label, icon: Icon, onClick, color }) => (
              <button key={label} onClick={onClick} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium transition hover:bg-white/5" style={{ color }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* RIGHT DATA AREA */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2 space-y-4">
          {/* Stat Row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Coin Balance" value={user.coin_balance ?? "\u2014"} color={BRAND.warning} />
            <StatCard label="Total XP" value={user.xp != null ? user.xp.toLocaleString() : "\u2014"} color={BRAND.primary} />
            <StatCard label="Streak" value={user.streak != null ? `${user.streak} Days` : "\u2014"} color={BRAND.error} />
          </div>

          {/* Tab Container */}
          <div className="rounded-xl overflow-hidden" style={cardStyle}>
            <div className="px-3 pt-3">
              <TabBar tabs={contentTabs} active={tab} onChange={setTab} />
            </div>

            <div className="p-4">
              {/* Overview */}
              {tab === "overview" && (
                <div className="rounded-lg p-4" style={{ backgroundColor: `${BRAND.surface}80` }}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: BRAND.textDim }}>Goal & Assessment</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {([["Current Goal", user.fitness_goal], ["Assessed Level", user.fitness_level], ["Joined", user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "\u2014"], ["Phone", user.phone || "\u2014"]] as const).map(([l, v]) => (
                      <div key={l}>
                        <p className="text-[9px] uppercase tracking-wider" style={{ color: BRAND.textDim }}>{l}</p>
                        <p className="text-[12px] font-medium" style={{ color: BRAND.textMain }}>{v || "\u2014"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fitness & Nutrition */}
              {tab === "fitness" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Dumbbell size={14} style={{ color: BRAND.textMain }} />
                      <h3 className="text-[12px] font-semibold" style={{ color: BRAND.textMain }}>Fitness Stats</h3>
                    </div>
                    <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: `${BRAND.surface}80` }}>
                      {fitSummary?.lifetime_stats ? Object.entries(fitSummary.lifetime_stats).map(([k, v]) => (
                        <KVRow key={k} label={k} value={String(v)} />
                      )) : <p className="text-[11px]" style={{ color: BRAND.textDim }}>No fitness data</p>}
                      {fitSummary?.best_day && (
                        <div className="pt-1.5 mt-1.5" style={{ borderTop: subtleBorder }}>
                          <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: BRAND.textDim }}>Best Day</p>
                          <p className="text-[12px]" style={{ color: BRAND.textMain }}>{fitSummary.best_day.date} &middot; {fitSummary.best_day.steps} steps &middot; {fitSummary.best_day.calories} cal</p>
                        </div>
                      )}
                    </div>
                    {fitSummary?.last_7_days && fitSummary.last_7_days.length > 0 && (
                      <div>
                        <p className="text-[10px] font-medium mb-1.5" style={{ color: BRAND.textDim }}>Last 7 Days</p>
                        <DataTable cols={["Date", "Steps", "Cal", "Goal"]}>
                          {fitSummary.last_7_days.map((d, i) => (
                            <TR key={i}>
                              <TD>{d.date || "\u2014"}</TD>
                              <TD>{d.steps ?? "\u2014"}</TD>
                              <TD>{d.calories ?? "\u2014"}</TD>
                              <TD>{d.goal_completed ? "\u2713" : "\u2717"}</TD>
                            </TR>
                          ))}
                        </DataTable>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Apple size={14} style={{ color: BRAND.textMain }} />
                      <h3 className="text-[12px] font-semibold" style={{ color: BRAND.textMain }}>Nutrition Data</h3>
                    </div>
                    <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: `${BRAND.surface}80` }}>
                      {nutSummary?.lifetime_stats ? Object.entries(nutSummary.lifetime_stats).map(([k, v]) => (
                        <KVRow key={k} label={k} value={String(v)} />
                      )) : <p className="text-[11px]" style={{ color: BRAND.textDim }}>No nutrition data</p>}
                      {nutSummary?.current_plan?.plan_name && (
                        <p className="text-[10px] pt-1.5 mt-1.5" style={{ borderTop: subtleBorder, color: BRAND.textDim }}>Current Plan: {nutSummary.current_plan.plan_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Recovery */}
              {tab === "recovery" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <HeartPulse size={14} style={{ color: BRAND.textMain }} />
                      <h3 className="text-[12px] font-semibold" style={{ color: BRAND.textMain }}>Session Stats</h3>
                    </div>
                    <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: `${BRAND.surface}80` }}>
                      {recSummary?.session_stats ? Object.entries(recSummary.session_stats).map(([k, v]) => (
                        <KVRow key={k} label={k} value={String(v)} />
                      )) : <p className="text-[11px]" style={{ color: BRAND.textDim }}>No recovery data</p>}
                    </div>
                  </div>
                  {recSummary?.wellness_averages && Object.keys(recSummary.wellness_averages).length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[12px] font-semibold" style={{ color: BRAND.textMain }}>Wellness Averages</h3>
                      <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: `${BRAND.surface}80` }}>
                        {Object.entries(recSummary.wellness_averages).map(([k, v]) => (
                          <KVRow key={k} label={k} value={String(v)} />
                        ))}
                      </div>
                    </div>
                  )}
                  {recSummary?.favorite_recovery_types && recSummary.favorite_recovery_types.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-[10px] font-medium mb-1.5" style={{ color: BRAND.textDim }}>Favorite Recovery Types</p>
                      <DataTable cols={["Type", "Sessions"]}>
                        {recSummary.favorite_recovery_types.map((t, i) => (
                          <TR key={i}>
                            <TD>{t.name || t.recovery_type_name || "\u2014"}</TD>
                            <TD>{t.count ?? t.session_count ?? "\u2014"}</TD>
                          </TR>
                        ))}
                      </DataTable>
                    </div>
                  )}
                </div>
              )}

              {/* Social */}
              {tab === "social" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle size={14} style={{ color: BRAND.textMain }} />
                    <h3 className="text-[12px] font-semibold" style={{ color: BRAND.textMain }}>Moderation Status</h3>
                  </div>
                  {modStatus ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg p-3" style={{ backgroundColor: `${BRAND.surface}80` }}>
                          <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Ban Status</p>
                          {modStatus.is_banned ? (
                            <span className="flex items-center gap-1 text-[12px]" style={{ color: BRAND.error }}><ShieldAlert size={13} /> Banned</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[12px]" style={{ color: BRAND.success }}><Shield size={13} /> Good Standing</span>
                          )}
                        </div>
                        <div className="rounded-lg p-3" style={{ backgroundColor: `${BRAND.surface}80` }}>
                          <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Warning Count</p>
                          <p className="text-[16px] font-bold" style={{ color: BRAND.textMain }}>{modStatus.warning_count ?? 0}</p>
                        </div>
                      </div>
                      <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: `${BRAND.surface}80` }}>
                        {Object.entries(modStatus).filter(([k]) => !["is_banned", "warning_count"].includes(k)).map(([k, v]) => (
                          <KVRow key={k} label={k} value={String(v)} />
                        ))}
                      </div>
                    </>
                  ) : <p className="text-[11px]" style={{ color: BRAND.textDim }}>No moderation data</p>}

                  {/* Call History */}
                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Phone size={14} style={{ color: BRAND.textMain }} />
                      <h3 className="text-[12px] font-semibold" style={{ color: BRAND.textMain }}>Call History</h3>
                    </div>
                    {callHistory && callHistory.length > 0 ? (
                      <DataTable cols={["Date", "Type", "Duration", "Participant", "Status"]}>
                        {callHistory.map((c, i) => (
                          <TR key={c.id || i}>
                            <TD><span className="text-[10px]">{c.created_at ? new Date(c.created_at).toLocaleString() : "\u2014"}</span></TD>
                            <TD><StatusBadge status={c.call_type || "voice"} /></TD>
                            <TD><span className="text-[11px]">{c.duration ? `${Math.round(c.duration)}s` : "\u2014"}</span></TD>
                            <TD><span className="text-[11px]">{c.other_user?.name || c.other_user?.email || c.caller?.name || c.receiver?.name || "\u2014"}</span></TD>
                            <TD><StatusBadge status={c.status || "unknown"} /></TD>
                          </TR>
                        ))}
                      </DataTable>
                    ) : <p className="text-[11px]" style={{ color: BRAND.textDim }}>No call history</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Comprehensive Data Modal */}
      {showCompModal && (
        <Modal title="User Data" onClose={() => setShowCompModal(false)} wide>
          <pre className="text-[10px] overflow-auto whitespace-pre-wrap" style={{ color: BRAND.textMain }}>
            {JSON.stringify(compData, null, 2)}
          </pre>
        </Modal>
      )}
    </div>
  );
}
