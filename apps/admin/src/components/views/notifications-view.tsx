"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Eye, Trash2, Bell, Send, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import {
  PageHeader, TabBar, DataTable, TR, TD, Modal, ConfirmDialog,
  EmptyState, StatCard, StatusBadge, SimplePagination,
  PrimaryButton, GhostButton, FormField, inputStyle, fadeUp, cardStyle,
} from "@/components/shared";

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

type Tab = "list" | "send" | "stats" | "templates";

export default function NotificationsView({ api, showToast }: ViewProps) {
  const [tab, setTab] = useState<Tab>("list");

  /* ── List state ─────────────────────────────────── */
  const [notifs, setNotifs] = useState<any[]>([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifsNext, setNotifsNext] = useState<string | null>(null);
  const [notifsPrev, setNotifsPrev] = useState<string | null>(null);
  const [nSearch, setNSearch] = useState("");
  const [nType, setNType] = useState("");
  const [nStatus, setNStatus] = useState("");
  const [nPriority, setNPriority] = useState("");
  const [nChannel, setNChannel] = useState("");
  const [confirmDelNotif, setConfirmDelNotif] = useState<string | null>(null);
  const [notifDetail, setNotifDetail] = useState<any>(null);

  /* ── Send state ─────────────────────────────────── */
  const [sendMode, setSendMode] = useState("single");
  const [sendForm, setSendForm] = useState({ user_id: "", title: "", body: "", notification_type: "system_alert", deep_link: "", image_url: "", screen_name: "", role: "", user_ids: "" });
  const [sending, setSending] = useState(false);

  /* ── Stats & Templates state ────────────────────── */
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  /* ── Loaders ────────────────────────────────────── */
  const loadNotifs = useCallback(async (url: string | null = null) => {
    setNotifsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (nSearch) params.search = nSearch;
      if (nType) params.notification_type = nType;
      if (nStatus) params.status = nStatus;
      const res = url ? await api.get<any>(url) : await api.get<any>("/admin/notifications/", params);
      setNotifs(res?.results || []);
      setNotifsNext(res?.next || null);
      setNotifsPrev(res?.previous || null);
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed to load notifications", "error"); }
    finally { setNotifsLoading(false); }
  }, [api, nSearch, nType, nStatus, showToast]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try { setStats(await api.get<any>("/admin/notifications/stats/")); }
    catch (err) { showToast(err instanceof Error ? err.message : "Failed to load stats", "error"); }
    finally { setStatsLoading(false); }
  }, [api, showToast]);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try { const res = await api.get<any>("/admin/notifications/templates/"); setTemplates(res?.results || res || []); }
    catch (err) { showToast(err instanceof Error ? err.message : "Failed to load templates", "error"); }
    finally { setTemplatesLoading(false); }
  }, [api, showToast]);

  useEffect(() => { if (tab === "list") loadNotifs(); }, [tab, loadNotifs]);
  useEffect(() => { if (tab === "stats") loadStats(); }, [tab, loadStats]);
  useEffect(() => { if (tab === "templates") loadTemplates(); }, [tab, loadTemplates]);

  /* ── Actions ────────────────────────────────────── */
  async function deleteNotif(id: string) {
    try { await api.del(`/admin/notifications/${id}/`); showToast("Deleted", "success"); setConfirmDelNotif(null); loadNotifs(); }
    catch (err) { showToast(err instanceof Error ? err.message : "Delete failed", "error"); }
  }

  function setSend(k: string, v: string) { setSendForm(f => ({ ...f, [k]: v })); }

  async function submitSend() {
    setSending(true);
    try {
      if (sendMode === "single") {
        await api.post("/admin/notifications/", { user_id: sendForm.user_id, title: sendForm.title, body: sendForm.body, notification_type: sendForm.notification_type, deep_link: sendForm.deep_link || undefined, image_url: sendForm.image_url || undefined, screen_name: sendForm.screen_name || undefined });
      } else if (sendMode === "role") {
        await api.post("/admin/notifications/send-to-role/", { role: sendForm.role, title: sendForm.title, body: sendForm.body, notification_type: sendForm.notification_type, deep_link: sendForm.deep_link || undefined, image_url: sendForm.image_url || undefined });
      } else {
        const ids = sendForm.user_ids.split(",").map(s => s.trim()).filter(Boolean);
        await api.post("/admin/notifications/bulk-send/", { user_ids: ids, title: sendForm.title, body: sendForm.body, notification_type: sendForm.notification_type });
      }
      showToast("Notification sent", "success");
      setSendForm({ user_id: "", title: "", body: "", notification_type: "system_alert", deep_link: "", image_url: "", screen_name: "", role: "", user_ids: "" });
    } catch (err) { showToast(err instanceof Error ? err.message : "Send failed", "error"); }
    finally { setSending(false); }
  }

  const selectClass = "w-full rounded-lg px-3 py-1.5 text-[12px] outline-none";

  return (
    <div className="space-y-4">
      <PageHeader title="Notifications" subtitle="Manage push notifications, templates and delivery stats" />

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar<Tab>
          tabs={[
            { key: "list", label: "List", icon: Bell },
            { key: "send", label: "Send", icon: Send },
            { key: "stats", label: "Stats" },
            { key: "templates", label: "Templates", icon: FileText },
          ]}
          active={tab}
          onChange={setTab}
        />
      </motion.div>

      {/* ── List Tab ───────────────────────────────── */}
      {tab === "list" && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <input value={nSearch} onChange={e => setNSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadNotifs()}
              placeholder="Search..." className={`flex-1 min-w-[120px] rounded-lg px-3 py-1.5 text-[12px] outline-none placeholder:text-[11px]`} style={inputStyle} />
            <select value={nType} onChange={e => setNType(e.target.value)} className={selectClass} style={inputStyle}>
              <option value="">All Types</option><option value="system_alert">System Alert</option><option value="booking_confirmed">Booking Confirmed</option><option value="event_reminder">Event Reminder</option><option value="achievement_unlocked">Achievement</option>
            </select>
            <select value={nStatus} onChange={e => setNStatus(e.target.value)} className={selectClass} style={inputStyle}>
              <option value="">All Statuses</option><option value="pending">Pending</option><option value="sent">Sent</option><option value="delivered">Delivered</option><option value="read">Read</option><option value="failed">Failed</option>
            </select>
            <select value={nPriority} onChange={e => setNPriority(e.target.value)} className={selectClass} style={inputStyle}>
              <option value="">All Priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option>
            </select>
            <select value={nChannel} onChange={e => setNChannel(e.target.value)} className={selectClass} style={inputStyle}>
              <option value="">All Channels</option><option value="push">Push</option><option value="in_app">In-App</option><option value="email">Email</option><option value="all">All</option>
            </select>
            <PrimaryButton onClick={() => loadNotifs()}><Search size={12} /></PrimaryButton>
          </div>

          {notifsLoading ? <div className="flex justify-center py-10"><Spinner /></div> : notifs.length === 0 ? (
            <EmptyState icon={Bell} message="No notifications found" />
          ) : (
            <>
              <DataTable cols={["User", "Title", "Type", "Priority", "Status", "Channel", "Sent At", "Actions"]}>
                {notifs.map(n => (
                  <TR key={n.id}>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{n.user_email || n.recipient || "\u2014"}</span></TD>
                    <TD><span className="text-[12px] font-medium">{n.title}</span></TD>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{n.notification_type}</span></TD>
                    <TD><StatusBadge status={n.priority || "normal"} /></TD>
                    <TD><StatusBadge status={n.status || "pending"} /></TD>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{n.channel}</span></TD>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{n.sent_at ? new Date(n.sent_at).toLocaleDateString() : "\u2014"}</span></TD>
                    <TD>
                      <div className="flex gap-1">
                        <GhostButton onClick={() => api.get<any>(`/admin/notifications/${n.id}/`).then(d => setNotifDetail(d?.data || d)).catch((e: unknown) => showToast(e instanceof Error ? e.message : "Load failed", "error"))}>
                          <Eye size={12} />
                        </GhostButton>
                        <GhostButton onClick={() => setConfirmDelNotif(n.id)}>
                          <Trash2 size={12} style={{ color: BRAND.error }} />
                        </GhostButton>
                      </div>
                    </TD>
                  </TR>
                ))}
              </DataTable>
              <SimplePagination prevUrl={notifsPrev} nextUrl={notifsNext} onPrev={() => loadNotifs(notifsPrev)} onNext={() => loadNotifs(notifsNext)} count={notifs.length} />
            </>
          )}
        </motion.div>
      )}

      {/* ── Send Tab ───────────────────────────────── */}
      {tab === "send" && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="max-w-xl space-y-4">
          <div className="flex gap-2">
            {(["single", "role", "bulk"] as const).map(v => (
              <button key={v} onClick={() => setSendMode(v)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition"
                style={{
                  backgroundColor: sendMode === v ? `${BRAND.primary}18` : "transparent",
                  color: sendMode === v ? BRAND.textMain : BRAND.textDim,
                }}>
                {v === "single" ? "Single User" : v === "role" ? "By Role" : "Bulk"}
              </button>
            ))}
          </div>

          {sendMode === "single" && (
            <FormField label="User ID">
              <input value={sendForm.user_id} onChange={e => setSend("user_id", e.target.value)} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
          )}
          {sendMode === "role" && (
            <FormField label="Role">
              <select value={sendForm.role} onChange={e => setSend("role", e.target.value)} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle}>
                <option value="">Select role</option><option value="user">User</option><option value="trainer">Trainer</option><option value="admin">Admin</option>
              </select>
            </FormField>
          )}
          {sendMode === "bulk" && (
            <FormField label="User IDs (comma-separated)">
              <textarea value={sendForm.user_ids} onChange={e => setSend("user_ids", e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none resize-none" style={inputStyle} placeholder="uuid1, uuid2, ..." />
            </FormField>
          )}

          <FormField label="Title">
            <input value={sendForm.title} onChange={e => setSend("title", e.target.value)} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Body">
            <textarea value={sendForm.body} onChange={e => setSend("body", e.target.value)} rows={3}
              className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none resize-none" style={inputStyle} placeholder="Notification message..." />
          </FormField>
          <FormField label="Notification Type">
            <input value={sendForm.notification_type} onChange={e => setSend("notification_type", e.target.value)} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Deep Link (optional)">
            <input value={sendForm.deep_link} onChange={e => setSend("deep_link", e.target.value)} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Image URL (optional)">
            <input value={sendForm.image_url} onChange={e => setSend("image_url", e.target.value)} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
          </FormField>
          {sendMode === "single" && (
            <FormField label="Screen Name (optional)">
              <input value={sendForm.screen_name} onChange={e => setSend("screen_name", e.target.value)} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
          )}
          <PrimaryButton onClick={submitSend} disabled={sending}>{sending ? "Sending..." : "Send Notification"}</PrimaryButton>
        </motion.div>
      )}

      {/* ── Stats Tab ──────────────────────────────── */}
      {tab === "stats" && (
        statsLoading ? <div className="flex justify-center py-10"><Spinner /></div> : stats ? (
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <StatCard label="Total" value={stats.overview?.total_notifications} />
              <StatCard label="Sent" value={stats.overview?.sent_notifications} />
              <StatCard label="Delivered" value={stats.overview?.delivered_notifications} color={BRAND.success} />
              <StatCard label="Read" value={stats.overview?.read_notifications} color={BRAND.info} />
              <StatCard label="Clicked" value={stats.overview?.clicked_notifications} color={BRAND.accent} />
              <StatCard label="Failed" value={stats.overview?.failed_notifications} color={BRAND.error} />
            </div>
            {stats.notification_types?.length > 0 && (
              <div className="rounded-xl p-4" style={cardStyle}>
                <p className="text-[12px] font-semibold mb-3" style={{ color: BRAND.textMain }}>By Type</p>
                <DataTable cols={["Type", "Count"]}>
                  {stats.notification_types.map((t: any) => (
                    <TR key={t.notification_type}>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{t.notification_type}</span></TD>
                      <TD><span className="text-[12px] font-semibold" style={{ color: BRAND.accent }}>{t.count}</span></TD>
                    </TR>
                  ))}
                </DataTable>
              </div>
            )}
          </motion.div>
        ) : <EmptyState icon={Bell} message="No stats available" />
      )}

      {/* ── Templates Tab ─────────────────────────── */}
      {tab === "templates" && (
        templatesLoading ? <div className="flex justify-center py-10"><Spinner /></div> : templates.length === 0 ? (
          <EmptyState icon={FileText} message="No templates found" />
        ) : (
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <DataTable cols={["Name", "Type", "Title Template", "Screen", "Active"]}>
              {templates.map(t => (
                <TR key={t.id}>
                  <TD><span className="text-[12px] font-medium">{t.name}</span></TD>
                  <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{t.notification_type}</span></TD>
                  <TD><span className="text-[11px] max-w-[200px] truncate block" style={{ color: BRAND.textDim }}>{t.title_template}</span></TD>
                  <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{t.deep_link_template || t.screen_name || "\u2014"}</span></TD>
                  <TD><StatusBadge status={t.is_active ? "active" : "inactive"} /></TD>
                </TR>
              ))}
            </DataTable>
          </motion.div>
        )
      )}

      {/* ── Delete Confirm ─────────────────────────── */}
      {confirmDelNotif && (
        <ConfirmDialog
          message="Delete this notification?"
          confirmLabel="Delete"
          onConfirm={() => deleteNotif(confirmDelNotif)}
          onCancel={() => setConfirmDelNotif(null)}
        />
      )}

      {/* ── Notification Detail Modal ─────────────── */}
      {notifDetail && (
        <Modal title="Notification Detail" onClose={() => setNotifDetail(null)} wide>
          <div className="space-y-2">
            {([
              ["ID", notifDetail.id], ["Title", notifDetail.title], ["Body", notifDetail.body],
              ["Recipient", notifDetail.user_email || notifDetail.recipient], ["Type", notifDetail.notification_type],
              ["Priority", notifDetail.priority], ["Channel", notifDetail.channel], ["Status", notifDetail.status],
              ["Sent At", notifDetail.sent_at ? new Date(notifDetail.sent_at).toLocaleString() : null],
              ["Read At", notifDetail.read_at ? new Date(notifDetail.read_at).toLocaleString() : null],
              ["Created", notifDetail.created_at ? new Date(notifDetail.created_at).toLocaleString() : null],
            ] as [string, any][]).filter(([, v]) => v != null && v !== "").map(([label, val]) => (
              <div key={label} className="flex gap-4">
                <span className="text-[10px] uppercase tracking-wider w-28 shrink-0 pt-0.5" style={{ color: BRAND.textDim }}>{label}</span>
                <span className="text-[12px] break-words" style={{ color: BRAND.textMain }}>{String(val)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <GhostButton onClick={() => setNotifDetail(null)}>Close</GhostButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
