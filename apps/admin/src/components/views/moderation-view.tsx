"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, AlertTriangle, Shield, Clock, Ban, Phone, Video, Users, Flag, X, Eye, ChevronLeft, ChevronRight, MessageSquare, Wifi } from "lucide-react";
import { BRAND, Spinner, Pagination } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";

/* ── Types ──────────────────────────────────────── */

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
  onSetPendingReports?: (n: number) => void;
}

/* ── Animations ─────────────────────────────────── */

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35, ease } }),
};

/* ── Shared Components ──────────────────────────── */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
        className="rounded-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.1)` }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid rgba(126,34,206,0.08)` }}>
          <h3 className="text-[14px] font-semibold" style={{ color: BRAND.textMain }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Close"><X size={16} style={{ color: BRAND.textMuted }} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </motion.div>
    </div>
  );
}

function DataRow({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid rgba(126,34,206,0.05)` }}>
      <span className="text-[12px]" style={{ color: BRAND.textMuted }}>{label}</span>
      <span className="text-[12px] font-medium" style={{ color: color || BRAND.textMain }}>{value}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof Shield; message: string }) {
  return (
    <div className="text-center py-10 rounded-xl" style={{ backgroundColor: BRAND.surface }}>
      <Icon size={24} className="mx-auto mb-2" style={{ color: BRAND.textDim }} />
      <p className="text-[12px]" style={{ color: BRAND.textDim }}>{message}</p>
    </div>
  );
}

/* ── Main Component ─────────────────────────────── */

export default function ModerationView({ api, showToast, onSetPendingReports }: ViewProps) {
  type TabKey = "reports" | "violations" | "bans" | "mutes" | "messages" | "calls" | "online" | "privatemsgs";
  const [tab, setTab] = useState<TabKey>("reports");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [modStats, setModStats] = useState<any>(null);
  const [showCreateBan, setShowCreateBan] = useState(false);
  const [showCreateMute, setShowCreateMute] = useState(false);
  const [banForm, setBanForm] = useState({ user_id: "", community_id: "", reason: "", days: 7, permanent: false });
  const [muteForm, setMuteForm] = useState({ user_id: "", community_id: "", hours: 24, reason: "" });
  const [callStats, setCallStats] = useState<any>(null);
  const [onlineData, setOnlineData] = useState<any>(null);

  const TABS: { key: TabKey; label: string; icon: typeof Shield }[] = [
    { key: "reports", label: "Reports", icon: Flag },
    { key: "violations", label: "Violations", icon: AlertTriangle },
    { key: "bans", label: "Bans", icon: Ban },
    { key: "mutes", label: "Mutes", icon: Clock },
    { key: "messages", label: "Messages", icon: MessageSquare },
    { key: "calls", label: "Calls", icon: Phone },
    { key: "online", label: "Online", icon: Wifi },
    { key: "privatemsgs", label: "Private Msgs", icon: MessageSquare },
  ];

  const ENDPOINTS: Record<string, string> = {
    reports: "/admin/reports/",
    violations: "/admin/message-violations/",
    bans: "/admin/community-bans/",
    mutes: "/admin/community-mutes/",
  };

  /* ── Data Loading ─────────────────────────────── */

  const load = useCallback(async (url: string | null = null) => {
    setLoading(true);
    try {
      const endpoint = ENDPOINTS[tab];
      if (tab === "messages") {
        const res = await api.get<any>("/admin/communities/");
        setItems(res?.results || (Array.isArray(res) ? res : []));
      } else if (tab === "calls") {
        const [calls, stats] = await Promise.all([
          api.get<any>("/admin/calls/"),
          api.get<any>("/admin/calls/stats/").catch(() => null),
        ]);
        setItems(calls?.results || (Array.isArray(calls) ? calls : []));
        setCallStats(stats);
      } else if (tab === "online") {
        const res = await api.get<any>("/admin/presence/online/");
        setOnlineData(res);
        setItems(res?.users || (Array.isArray(res) ? res : []));
      } else if (tab === "privatemsgs") {
        const res = await api.get<any>("/admin/private-messages/");
        setItems(res?.results || (Array.isArray(res) ? res : []));
      } else if (endpoint) {
        const res = url ? await api.get<any>(url) : await api.get<any>(endpoint);
        setItems(res?.results || (Array.isArray(res) ? res : []));
        setNextUrl(res?.next || null);
        setPrevUrl(res?.previous || null);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [api, tab, showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get<any>("/admin/moderation/stats/").then(r => {
      setModStats(r);
      onSetPendingReports?.(r?.total_reports_pending ?? 0);
    }).catch(() => {});
  }, [api, onSetPendingReports]);

  /* ── Actions ──────────────────────────────────── */

  async function resolveReport(id: string) {
    try { await api.post(`/admin/reports/${id}/resolve/`, { action: "resolve" }); showToast("Report resolved", "success"); load(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
  }

  async function ignoreViolation(id: string) {
    try { await api.del(`/admin/message-violations/${id}/ignore/`); showToast("Violation ignored", "success"); load(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
  }

  async function removeBan(id: string) {
    try { await api.del(`/admin/community-bans/${id}/remove/`); showToast("Ban removed", "success"); load(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
  }

  async function removeMute(id: string) {
    try { await api.del(`/admin/community-mutes/${id}/remove/`); showToast("Mute removed", "success"); load(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
  }

  async function createBan() {
    try { await api.post("/admin/community-bans/create/", banForm); showToast("Ban created", "success"); setShowCreateBan(false); setBanForm({ user_id: "", community_id: "", reason: "", days: 7, permanent: false }); load(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
  }

  async function createMute() {
    try { await api.post("/admin/community-mutes/create/", muteForm); showToast("Mute created", "success"); setShowCreateMute(false); setMuteForm({ user_id: "", community_id: "", hours: 24, reason: "" }); load(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
  }

  /* ── Render ───────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: BRAND.textMain }}>Moderation</h1>
          <p className="text-[12px] mt-0.5" style={{ color: BRAND.textDim }}>Reports, violations, bans, and platform safety</p>
        </div>
        {(tab === "bans" || tab === "mutes") && (
          <button
            onClick={() => tab === "bans" ? setShowCreateBan(true) : setShowCreateMute(true)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5"
            style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
          >
            <Plus size={13} /> Create {tab === "bans" ? "Ban" : "Mute"}
          </button>
        )}
      </motion.div>

      {/* Stats Summary */}
      {modStats && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {([
            ["Reports", modStats.total_reports_pending, BRAND.warning],
            ["Bans", modStats.total_bans_active, BRAND.error],
            ["Mutes", modStats.total_mutes_active, BRAND.info],
            ["Violations", modStats.total_violations_today, BRAND.error],
            ["Flagged", modStats.flagged_messages, BRAND.warning],
            ["Appeals", modStats.appeals_pending, BRAND.primary],
          ] as const).map(([label, value, color]) => (
            <div key={label} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.06)` }}>
              <p className="text-[16px] font-bold" style={{ color: (value ?? 0) > 0 ? color : BRAND.textDim }}>{value ?? 0}</p>
              <p className="text-[9px] uppercase tracking-wider" style={{ color: BRAND.textDim }}>{label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="flex gap-0.5 overflow-x-auto p-0.5 rounded-lg" style={{ backgroundColor: `${BRAND.surface}` }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition"
            style={{
              backgroundColor: tab === key ? `${BRAND.primary}18` : "transparent",
              color: tab === key ? BRAND.textMain : BRAND.textDim,
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          {/* Reports */}
          {tab === "reports" && (
            items.length === 0 ? <EmptyState icon={Flag} message="No pending reports" /> : (
              <div className="space-y-2">
                {items.map((r: any) => (
                  <div key={r.id} className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.06)` }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: BRAND.textMain }}>{r.reason || r.report_type || "Report"}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: BRAND.textDim }}>by {r.reporter_name || r.reporter || "Unknown"} &middot; {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</p>
                    </div>
                    <button onClick={() => resolveReport(r.id)} className="px-2.5 py-1 rounded-md text-[11px] font-medium transition hover:opacity-80" style={{ backgroundColor: `${BRAND.success}15`, color: BRAND.success }}>Resolve</button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Violations */}
          {tab === "violations" && (
            items.length === 0 ? <EmptyState icon={AlertTriangle} message="No violations" /> : (
              <div className="space-y-2">
                {items.map((v: any) => (
                  <div key={v.id} className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.06)` }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: BRAND.textMain }}>{v.violation_type || v.reason || "Violation"}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: BRAND.textDim }}>{v.user_name || v.user || "Unknown"} &middot; {v.content?.slice(0, 50) || ""}</p>
                    </div>
                    <button onClick={() => ignoreViolation(v.id)} className="px-2.5 py-1 rounded-md text-[11px] font-medium" style={{ color: BRAND.textDim }}>Ignore</button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Bans */}
          {tab === "bans" && (
            items.length === 0 ? <EmptyState icon={Ban} message="No active bans" /> : (
              <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid rgba(126,34,206,0.06)` }}>
                <table className="w-full text-[12px]">
                  <thead><tr style={{ backgroundColor: BRAND.surface }}><th className="text-left px-3 py-2 font-medium" style={{ color: BRAND.textDim }}>User</th><th className="text-left px-3 py-2 font-medium" style={{ color: BRAND.textDim }}>Community</th><th className="text-left px-3 py-2 font-medium" style={{ color: BRAND.textDim }}>Reason</th><th className="text-right px-3 py-2 font-medium" style={{ color: BRAND.textDim }}>Action</th></tr></thead>
                  <tbody>{items.map((b: any) => (
                    <tr key={b.id} style={{ borderTop: `1px solid rgba(126,34,206,0.05)` }}>
                      <td className="px-3 py-2" style={{ color: BRAND.textMain }}>{b.user_name || b.user || "—"}</td>
                      <td className="px-3 py-2" style={{ color: BRAND.textMuted }}>{b.community_name || b.community || "—"}</td>
                      <td className="px-3 py-2" style={{ color: BRAND.textMuted }}>{b.reason || "—"}</td>
                      <td className="px-3 py-2 text-right"><button onClick={() => removeBan(b.id)} className="text-[11px] font-medium" style={{ color: BRAND.error }}>Remove</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )
          )}

          {/* Mutes */}
          {tab === "mutes" && (
            items.length === 0 ? <EmptyState icon={Clock} message="No active mutes" /> : (
              <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid rgba(126,34,206,0.06)` }}>
                <table className="w-full text-[12px]">
                  <thead><tr style={{ backgroundColor: BRAND.surface }}><th className="text-left px-3 py-2 font-medium" style={{ color: BRAND.textDim }}>User</th><th className="text-left px-3 py-2 font-medium" style={{ color: BRAND.textDim }}>Community</th><th className="text-left px-3 py-2 font-medium" style={{ color: BRAND.textDim }}>Reason</th><th className="text-right px-3 py-2 font-medium" style={{ color: BRAND.textDim }}>Action</th></tr></thead>
                  <tbody>{items.map((m: any) => (
                    <tr key={m.id} style={{ borderTop: `1px solid rgba(126,34,206,0.05)` }}>
                      <td className="px-3 py-2" style={{ color: BRAND.textMain }}>{m.user_name || m.user || "—"}</td>
                      <td className="px-3 py-2" style={{ color: BRAND.textMuted }}>{m.community_name || m.community || "—"}</td>
                      <td className="px-3 py-2" style={{ color: BRAND.textMuted }}>{m.reason || "—"}</td>
                      <td className="px-3 py-2 text-right"><button onClick={() => removeMute(m.id)} className="text-[11px] font-medium" style={{ color: BRAND.error }}>Remove</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )
          )}

          {/* Calls */}
          {tab === "calls" && (
            <div className="space-y-3">
              {callStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(callStats).filter(([k]) => typeof callStats[k] === "number").slice(0, 4).map(([k, v]) => (
                    <div key={k} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.06)` }}>
                      <p className="text-[14px] font-bold" style={{ color: BRAND.textMain }}>{String(v)}</p>
                      <p className="text-[9px] uppercase tracking-wider capitalize" style={{ color: BRAND.textDim }}>{k.replace(/_/g, " ")}</p>
                    </div>
                  ))}
                </div>
              )}
              {items.length === 0 ? <EmptyState icon={Phone} message="No call records" /> : (
                <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid rgba(126,34,206,0.06)` }}>
                  <table className="w-full text-[12px]">
                    <thead><tr style={{ backgroundColor: BRAND.surface }}><th className="text-left px-3 py-2 font-medium" style={{ color: BRAND.textDim }}>Caller</th><th className="text-left px-3 py-2 font-medium" style={{ color: BRAND.textDim }}>Type</th><th className="text-left px-3 py-2 font-medium" style={{ color: BRAND.textDim }}>Duration</th><th className="text-left px-3 py-2 font-medium" style={{ color: BRAND.textDim }}>Status</th></tr></thead>
                    <tbody>{items.map((c: any, i: number) => (
                      <tr key={c.id || i} style={{ borderTop: `1px solid rgba(126,34,206,0.05)` }}>
                        <td className="px-3 py-2" style={{ color: BRAND.textMain }}>{c.caller_name || c.caller || "—"}</td>
                        <td className="px-3 py-2"><span className="flex items-center gap-1" style={{ color: BRAND.textMuted }}>{c.call_type === "video" ? <Video size={11} /> : <Phone size={11} />}{c.call_type || "—"}</span></td>
                        <td className="px-3 py-2" style={{ color: BRAND.textMuted }}>{c.duration ? `${Math.round(c.duration / 60)}m` : "—"}</td>
                        <td className="px-3 py-2"><span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: c.status === "completed" ? BRAND.success : BRAND.warning, backgroundColor: c.status === "completed" ? `${BRAND.success}10` : `${BRAND.warning}10` }}>{c.status || "—"}</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Online Users */}
          {tab === "online" && (
            items.length === 0 ? <EmptyState icon={Wifi} message="No online users" /> : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {items.map((u: any, i: number) => (
                  <div key={u.id || i} className="rounded-lg p-3 flex items-center gap-2.5" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.06)` }}>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold" style={{ backgroundColor: `${BRAND.accent}15`, color: BRAND.accent }}>
                        {(u.name || u.username || "U")[0].toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: BRAND.success, borderColor: BRAND.surface }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: BRAND.textMain }}>{u.name || u.username || "User"}</p>
                      <p className="text-[10px]" style={{ color: BRAND.textDim }}>{u.last_seen || "Online"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Messages & Private Messages */}
          {(tab === "messages" || tab === "privatemsgs") && (
            items.length === 0 ? <EmptyState icon={MessageSquare} message={`No ${tab === "privatemsgs" ? "private " : ""}messages to moderate`} /> : (
              <div className="space-y-2">
                {items.map((m: any, i: number) => (
                  <div key={m.id || i} className="rounded-lg p-3" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.06)` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium" style={{ color: BRAND.textMain }}>{m.name || m.sender_name || m.sender || "Message"}</span>
                      <span className="text-[10px]" style={{ color: BRAND.textDim }}>{m.member_count ? `${m.member_count} members` : m.created_at ? new Date(m.created_at).toLocaleDateString() : ""}</span>
                    </div>
                    <p className="text-[11px] line-clamp-2" style={{ color: BRAND.textMuted }}>{m.description || m.content || m.latest_message?.content || "—"}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Pagination */}
          {(nextUrl || prevUrl) && (
            <div className="flex items-center justify-end gap-1 mt-3">
              <button onClick={() => load(prevUrl)} disabled={!prevUrl} className="p-1.5 rounded-md transition disabled:opacity-30 hover:bg-white/5"><ChevronLeft size={14} style={{ color: BRAND.textMuted }} /></button>
              <button onClick={() => load(nextUrl)} disabled={!nextUrl} className="p-1.5 rounded-md transition disabled:opacity-30 hover:bg-white/5"><ChevronRight size={14} style={{ color: BRAND.textMuted }} /></button>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Create Ban Modal ───────────────────── */}
      {showCreateBan && (
        <Modal title="Create Ban" onClose={() => setShowCreateBan(false)}>
          <div className="space-y-3">
            {(["user_id", "community_id", "reason"] as const).map(k => (
              <div key={k}>
                <label className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>{k.replace(/_/g, " ")}</label>
                <input value={banForm[k]} onChange={e => setBanForm(f => ({ ...f, [k]: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ backgroundColor: BRAND.input, color: BRAND.textMain }} />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Duration (days)</label>
              <input type="number" value={banForm.days} onChange={e => setBanForm(f => ({ ...f, days: parseInt(e.target.value) || 7 }))} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ backgroundColor: BRAND.input, color: BRAND.textMain }} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ban_perm" checked={banForm.permanent} onChange={e => setBanForm(f => ({ ...f, permanent: e.target.checked }))} className="accent-purple-500" />
              <label htmlFor="ban_perm" className="text-[12px]" style={{ color: BRAND.textMuted }}>Permanent ban</label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowCreateBan(false)} className="px-3 py-1.5 rounded-lg text-[12px]" style={{ color: BRAND.textMuted }}>Cancel</button>
              <button onClick={createBan} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ backgroundColor: BRAND.error, color: "#fff" }}>Create Ban</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Create Mute Modal ──────────────────── */}
      {showCreateMute && (
        <Modal title="Create Mute" onClose={() => setShowCreateMute(false)}>
          <div className="space-y-3">
            {(["user_id", "community_id", "reason"] as const).map(k => (
              <div key={k}>
                <label className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>{k.replace(/_/g, " ")}</label>
                <input value={muteForm[k]} onChange={e => setMuteForm(f => ({ ...f, [k]: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ backgroundColor: BRAND.input, color: BRAND.textMain }} />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Duration (hours)</label>
              <input type="number" value={muteForm.hours} onChange={e => setMuteForm(f => ({ ...f, hours: parseInt(e.target.value) || 24 }))} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ backgroundColor: BRAND.input, color: BRAND.textMain }} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowCreateMute(false)} className="px-3 py-1.5 rounded-lg text-[12px]" style={{ color: BRAND.textMuted }}>Cancel</button>
              <button onClick={createMute} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ backgroundColor: BRAND.warning, color: BRAND.bg }}>Create Mute</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
