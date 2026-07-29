import { useState, useEffect } from "react";
import { ChevronLeft, Edit, Shield, ShieldAlert, Coins, Award, Flame, Dumbbell, Apple, HeartPulse, MessageCircle, Download, Database, KeyRound, Phone, X } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, Badge, TableWrap, TR, TD } from "../../components/ui";
import adminApi from "../../services/adminApi";

function UserDetailView({ token, showToast, userId, onBack }) {
  const [user, setUser] = useState(null);
  const [fitSummary, setFitSummary] = useState(null);
  const [nutSummary, setNutSummary] = useState(null);
  const [recSummary, setRecSummary] = useState(null);
  const [modStatus, setModStatus] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [compData, setCompData] = useState(null);
  const [showCompModal, setShowCompModal] = useState(false);
  const [callHistory, setCallHistory] = useState(null);

  useEffect(() => {
    adminApi.users.detail(token, userId).then(d => setUser(d)).catch(e => showToast(e.message, "error")).finally(() => setLoading(false));
    adminApi.fitness.userSummary(token, userId).then(setFitSummary).catch(() => { });
    adminApi.nutrition.userSummary(token, userId).then(setNutSummary).catch(() => { });
    adminApi.recovery.userSummary(token, userId).then(setRecSummary).catch(() => { });
    adminApi.moderation.userStatus(token, userId).then(setModStatus).catch(() => { });
  }, [token, userId, showToast]);

  useEffect(() => {
    if (tab === "social") adminApi.moderation.calls.userHistory(token, userId).then(r => setCallHistory(r?.results || r || [])).catch(() => {});
  }, [tab, token, userId]);

  async function downloadReport() {
    try {
      const res = await adminApi.users.report(token, userId);
      showToast("Report generated", "success");
      if (res) { setCompData(res); setShowCompModal(true); }
    } catch (err) { showToast(err.message, "error"); }
  }
  async function loadComprehensive() {
    try {
      const res = await adminApi.users.comprehensive(token, userId);
      setCompData(res);
      setShowCompModal(true);
    } catch (err) { showToast(err.message, "error"); }
  }
  async function resetPassword() {
    if (!window.confirm("Send password reset to this user?")) return;
    try { await adminApi.users.resetPassword(token, userId); showToast("Password reset sent", "success"); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function impersonate() {
    try {
      const res = await adminApi.users.impersonate(token, userId);
      const t = res?.access || res?.token;
      if (t) { navigator.clipboard?.writeText(t); showToast("Impersonation token copied!", "success"); }
    } catch (err) { showToast(err.message, "error"); }
  }
  async function warn() {
    try { await adminApi.moderation.warn(token, userId); showToast("User warned", "success"); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function toggleBan() {
    try {
      if (modStatus?.is_banned) { await adminApi.moderation.unban(token, userId); showToast("User unbanned", "success"); }
      else { await adminApi.moderation.ban(token, userId); showToast("User banned", "success"); }
      adminApi.moderation.userStatus(token, userId).then(setModStatus).catch(() => { });
    } catch (err) { showToast(err.message, "error"); }
  }

  if (loading) return <LoadingSpinner />;
  if (!user) return <p className="text-red-400">User not found</p>;

  return (
    <div className="space-y-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack}
          className="p-2 rounded-lg hover:bg-white/10 transition text-white"
          style={{ backgroundColor: BRAND.panel }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            {user.first_name} {user.last_name}
            {user.role === "admin" && <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-md uppercase tracking-wide">Admin</span>}
            {user.role === "trainer" && <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-md uppercase tracking-wide">Trainer</span>}
          </h1>
          <p className="text-sm mt-1" style={{ color: BRAND.textMuted }}>ID: {user.id} • Joined: {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "—"}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

        {/* LEFT SIDEBAR */}
        <div className="space-y-6">

          {/* Profile Card */}
          <div className="rounded-2xl border p-6 text-center shadow-xl" style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}>
            <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-lg"
              style={{ backgroundColor: BRAND.primary, color: BRAND.accent }}>
              {(user.first_name?.[0] || "?").toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-white">{user.first_name} {user.last_name}</h2>
            <p className="mb-4" style={{ color: BRAND.textMuted }}>{user.email}</p>

            <div className="flex justify-center gap-2 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                user.role === "admin" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                user.role === "trainer" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                "bg-blue-500/20 text-blue-400 border-blue-500/30"
              }`}>{user.role}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                user.is_active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}>{user.is_active ? "Active Account" : "Suspended"}</span>
              {modStatus?.is_banned && <Badge color="red">Banned</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-3 text-left border-t pt-4" style={{ borderColor: BRAND.panelLight }}>
              {[
                ["Goal", user.fitness_goal], ["Level", user.fitness_level],
                ["Joined", user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "—"],
                ["Phone", user.phone || "—"],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs uppercase tracking-wider" style={{ color: BRAND.textMuted }}>{l}</p>
                  <p className="text-white font-medium text-sm">{v || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="rounded-2xl border p-4 space-y-2 shadow-xl" style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}>
            <button onClick={() => {}} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
              <Edit size={16} /> <span>Edit User Profile</span>
            </button>
            <button onClick={impersonate} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
              <Shield size={16} /> <span>Impersonate User</span>
            </button>
            <button onClick={warn} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition">
              <ShieldAlert size={16} /> <span>Warn User</span>
            </button>
            <button onClick={toggleBan}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg transition ${modStatus?.is_banned ? "bg-green-500/10 hover:bg-green-500/20 text-green-400" : "bg-red-500/10 hover:bg-red-500/20 text-red-400"}`}>
              <ShieldAlert size={16} /> <span>{modStatus?.is_banned ? "Unban User" : "Ban User"}</span>
            </button>
            <button onClick={resetPassword} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition">
              <KeyRound size={16} /> <span>Reset Password</span>
            </button>
            <button onClick={downloadReport} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition">
              <Download size={16} /> <span>Download Report</span>
            </button>
            <button onClick={loadComprehensive} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition">
              <Database size={16} /> <span>Full User Data</span>
            </button>
          </div>
        </div>

        {/* RIGHT DATA AREA */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stat Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Coin Balance", value: user.coin_balance, icon: Coins, color: "bg-yellow-500/20 text-yellow-400" },
              { label: "Total XP", value: user.xp != null ? user.xp.toLocaleString() : null, icon: Award, color: "bg-purple-500/20 text-purple-400" },
              { label: "Current Streak", value: user.streak != null ? `${user.streak} Days` : null, icon: Flame, color: "bg-orange-500/20 text-orange-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl border p-4 flex items-center gap-4 shadow-xl" style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}>
                <div className={`p-3 rounded-xl ${color}`}><Icon size={24} /></div>
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: BRAND.textMuted }}>{label}</p>
                  <p className="text-xl font-bold text-white">{value ?? "—"}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tab Container */}
          <div className="rounded-2xl border overflow-hidden flex flex-col shadow-xl" style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}>
            <div className="flex border-b" style={{ borderColor: BRAND.panelLight }}>
              {[["overview", "Overview"], ["fitness", "Fitness & Nutrition"], ["recovery", "Recovery"], ["social", "Social"]].map(([t, l]) => (
                <button key={t} onClick={() => setTab(t)}
                  className="flex-1 py-4 text-sm font-bold uppercase tracking-wider transition"
                  style={{ color: tab === t ? BRAND.accent : BRAND.textMuted, borderBottom: tab === t ? `2px solid ${BRAND.accent}` : "2px solid transparent", backgroundColor: tab === t ? "rgba(255,255,255,0.05)" : "transparent" }}>
                  {l}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto">
              {tab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Goal & Assessment</h3>
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-black/20 border" style={{ borderColor: BRAND.panelLight }}>
                      <div><p className="text-xs text-gray-400">Current Goal</p><p className="text-white font-medium">{user.fitness_goal || "—"}</p></div>
                      <div><p className="text-xs text-gray-400">Assessed Level</p><p className="text-white font-medium">{user.fitness_level || "—"}</p></div>
                      <div><p className="text-xs text-gray-400">Joined</p><p className="text-white font-medium">{user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "—"}</p></div>
                      <div><p className="text-xs text-gray-400">Phone</p><p className="text-white font-medium">{user.phone || "—"}</p></div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "fitness" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white"><Dumbbell size={20} /><h3 className="font-bold text-lg">Fitness Stats</h3></div>
                    <div className="p-4 rounded-xl bg-black/20 border space-y-3" style={{ borderColor: BRAND.panelLight }}>
                      {fitSummary?.lifetime_stats ? Object.entries(fitSummary.lifetime_stats).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-gray-400">{k.replace(/_/g, " ")}</span>
                          <span className="text-white font-medium">{String(v)}</span>
                        </div>
                      )) : <p className="text-slate-500 text-sm">No fitness data</p>}
                      {fitSummary?.best_day && (
                        <div className="pt-2 border-t" style={{ borderColor: BRAND.panelLight }}>
                          <p className="text-xs text-gray-400 uppercase mb-1">Best Day</p>
                          <p className="text-white text-sm">{fitSummary.best_day.date} · {fitSummary.best_day.steps} steps · {fitSummary.best_day.calories} cal</p>
                        </div>
                      )}
                    </div>
                    {fitSummary?.last_7_days?.length > 0 && (
                      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BRAND.panelLight }}>
                        <p className="px-4 pt-3 pb-2 text-white font-medium text-sm">Last 7 Days</p>
                        <TableWrap cols={["Date", "Steps", "Cal", "Goal"]}>
                          {fitSummary.last_7_days.map((d, i) => (
                            <TR key={i}><TD>{d.date || "—"}</TD><TD>{d.steps ?? "—"}</TD><TD>{d.calories ?? "—"}</TD><TD>{d.goal_completed ? "✓" : "✗"}</TD></TR>
                          ))}
                        </TableWrap>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white"><Apple size={20} /><h3 className="font-bold text-lg">Nutrition Data</h3></div>
                    <div className="p-4 rounded-xl bg-black/20 border space-y-3" style={{ borderColor: BRAND.panelLight }}>
                      {nutSummary?.lifetime_stats ? Object.entries(nutSummary.lifetime_stats).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-gray-400">{k.replace(/_/g, " ")}</span>
                          <span className="text-white font-medium">{String(v)}</span>
                        </div>
                      )) : <p className="text-slate-500 text-sm">No nutrition data</p>}
                      {nutSummary?.current_plan?.plan_name && (
                        <p className="text-slate-400 text-xs mt-2 pt-2 border-t" style={{ borderColor: BRAND.panelLight }}>Current Plan: {nutSummary.current_plan.plan_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === "recovery" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white"><HeartPulse size={20} /><h3 className="font-bold text-lg">Session Stats</h3></div>
                    <div className="p-4 rounded-xl bg-black/20 border space-y-3" style={{ borderColor: BRAND.panelLight }}>
                      {recSummary?.session_stats ? Object.entries(recSummary.session_stats).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-gray-400">{k.replace(/_/g, " ")}</span>
                          <span className="text-white font-medium">{String(v)}</span>
                        </div>
                      )) : <p className="text-slate-500 text-sm">No recovery data</p>}
                    </div>
                  </div>
                  {recSummary?.wellness_averages && Object.keys(recSummary.wellness_averages).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-white">Wellness Averages</h3>
                      <div className="p-4 rounded-xl bg-black/20 border space-y-3" style={{ borderColor: BRAND.panelLight }}>
                        {Object.entries(recSummary.wellness_averages).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-sm">
                            <span className="text-gray-400">{k.replace(/_/g, " ")}</span>
                            <span className="text-white font-medium">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {recSummary?.favorite_recovery_types?.length > 0 && (
                    <div className="md:col-span-2 rounded-2xl border overflow-hidden" style={{ borderColor: BRAND.panelLight }}>
                      <p className="px-4 pt-3 pb-2 text-white font-medium text-sm">Favorite Recovery Types</p>
                      <TableWrap cols={["Type", "Sessions"]}>
                        {recSummary.favorite_recovery_types.map((t, i) => (
                          <TR key={i}><TD>{t.name || t.recovery_type_name || "—"}</TD><TD>{t.count ?? t.session_count ?? "—"}</TD></TR>
                        ))}
                      </TableWrap>
                    </div>
                  )}
                </div>
              )}

              {tab === "social" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-white"><MessageCircle size={20} /><h3 className="font-bold text-lg">Moderation Status</h3></div>
                  {modStatus ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-black/20 border" style={{ borderColor: BRAND.panelLight }}>
                          <p className="text-xs text-gray-400 mb-2">Ban Status</p>
                          {modStatus.is_banned ? (
                            <div className="flex items-center gap-2 text-red-400"><ShieldAlert size={16} /><span className="font-medium">User is Banned</span></div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-400"><Shield size={16} /><span className="font-medium">Good Standing</span></div>
                          )}
                        </div>
                        <div className="p-4 rounded-xl bg-black/20 border" style={{ borderColor: BRAND.panelLight }}>
                          <p className="text-xs text-gray-400 mb-1">Warning Count</p>
                          <p className="text-2xl text-white font-bold">{modStatus.warning_count ?? 0}</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-black/20 border space-y-3" style={{ borderColor: BRAND.panelLight }}>
                        {Object.entries(modStatus).filter(([k]) => !["is_banned", "warning_count"].includes(k)).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-sm">
                            <span className="text-gray-400">{k.replace(/_/g, " ")}</span>
                            <span className="text-white">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <p className="text-slate-500 text-sm">No moderation data</p>}

                  {/* Call History */}
                  <div className="mt-6">
                    <div className="flex items-center gap-2 text-white mb-3"><Phone size={20} /><h3 className="font-bold text-lg">Call History</h3></div>
                    {callHistory && callHistory.length > 0 ? (
                      <TableWrap cols={["Date", "Type", "Duration", "Participant", "Status"]}>
                        {callHistory.map((c, i) => (
                          <TR key={c.id || i}>
                            <TD>{c.created_at ? new Date(c.created_at).toLocaleString() : "—"}</TD>
                            <TD><span className={`px-2 py-1 rounded text-xs font-bold ${c.call_type === "video" ? "bg-pink-500/20 text-pink-400" : "bg-blue-500/20 text-blue-400"}`}>{c.call_type || "voice"}</span></TD>
                            <TD>{c.duration ? `${Math.round(c.duration)}s` : "—"}</TD>
                            <TD>{c.other_user?.name || c.other_user?.email || c.caller?.name || c.receiver?.name || "—"}</TD>
                            <TD><span className={`px-2 py-1 rounded text-xs font-bold ${c.status === "completed" ? "bg-green-500/20 text-green-400" : c.status === "missed" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{c.status || "—"}</span></TD>
                          </TR>
                        ))}
                      </TableWrap>
                    ) : <p className="text-slate-500 text-sm">No call history</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Data Modal */}
      {showCompModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="rounded-2xl border w-full max-w-3xl max-h-[80vh] flex flex-col" style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: BRAND.panelLight }}>
              <h3 className="text-white font-bold text-lg">User Data</h3>
              <button onClick={() => setShowCompModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <pre className="text-xs overflow-auto whitespace-pre-wrap" style={{ color: BRAND.textMain }}>
                {JSON.stringify(compData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDetailView;
