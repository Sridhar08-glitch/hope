import { useState, useEffect, useCallback } from "react";
import { Search, Eye, Trash2, Bell, Check, CheckCircle, ArrowUpRight, AlertTriangle } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, TableWrap, TR, TD, Badge, Btn, StatCard, Pagination, Modal, ConfirmModal, InputField } from "../../components/ui";
import adminApi from "../../services/adminApi";

function NotificationsView({ token, showToast }) {
  const [tab, setTab] = useState("list");

  const [notifs, setNotifs] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifsNext, setNotifsNext] = useState(null);
  const [notifsPrev, setNotifsPrev] = useState(null);
  const [nSearch, setNSearch] = useState("");
  const [nType, setNType] = useState("");
  const [nStatus, setNStatus] = useState("");
  const [nPriority, setNPriority] = useState("");
  const [nChannel, setNChannel] = useState("");
  const [confirmDelNotif, setConfirmDelNotif] = useState(null);
  const [notifDetail, setNotifDetail] = useState(null);

  const [sendMode, setSendMode] = useState("single");
  const [sendForm, setSendForm] = useState({ user_id: "", title: "", body: "", notification_type: "system_alert", deep_link: "", image_url: "", screen_name: "", role: "", user_ids: "" });
  const [sending, setSending] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const loadNotifs = useCallback(async (url = null) => {
    setNotifsLoading(true);
    try {
      const res = url
        ? await adminApi.notifications.listUrl(token, url)
        : await adminApi.notifications.list(token, { search: nSearch || undefined, notification_type: nType || undefined, status: nStatus || undefined });
      setNotifs(res?.results || []);
      setNotifsNext(res?.next || null);
      setNotifsPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setNotifsLoading(false); }
  }, [token, nSearch, nType, nStatus, nPriority, nChannel, showToast]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try { setStats(await adminApi.notifications.stats(token)); }
    catch (err) { showToast(err.message, "error"); }
    finally { setStatsLoading(false); }
  }, [token, showToast]);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await adminApi.notifications.templates(token);
      setTemplates(res?.results || res || []);
    } catch (err) { showToast(err.message, "error"); }
    finally { setTemplatesLoading(false); }
  }, [token, showToast]);

  useEffect(() => { if (tab === "list") loadNotifs(); }, [tab, loadNotifs]);
  useEffect(() => { if (tab === "stats") loadStats(); }, [tab, loadStats]);
  useEffect(() => { if (tab === "templates") loadTemplates(); }, [tab, loadTemplates]);

  async function deleteNotif(id) {
    try { await adminApi.notifications.delete(token, id); showToast("Deleted", "success"); setConfirmDelNotif(null); loadNotifs(); }
    catch (err) { showToast(err.message, "error"); }
  }

  function setSend(k, v) { setSendForm(f => ({ ...f, [k]: v })); }

  async function submitSend() {
    setSending(true);
    try {
      if (sendMode === "single") {
        await adminApi.notifications.create(token, { user_id: sendForm.user_id, title: sendForm.title, body: sendForm.body, notification_type: sendForm.notification_type, deep_link: sendForm.deep_link || undefined, image_url: sendForm.image_url || undefined, screen_name: sendForm.screen_name || undefined });
      } else if (sendMode === "role") {
        await adminApi.notifications.sendToRole(token, { role: sendForm.role, title: sendForm.title, body: sendForm.body, notification_type: sendForm.notification_type, deep_link: sendForm.deep_link || undefined, image_url: sendForm.image_url || undefined });
      } else {
        const ids = sendForm.user_ids.split(",").map(s => s.trim()).filter(Boolean);
        await adminApi.notifications.bulkSend(token, { user_ids: ids, title: sendForm.title, body: sendForm.body, notification_type: sendForm.notification_type });
      }
      showToast("Notification sent", "success");
      setSendForm({ user_id: "", title: "", body: "", notification_type: "system_alert", deep_link: "", image_url: "", screen_name: "", role: "", user_ids: "" });
    } catch (err) { showToast(err.message, "error"); }
    finally { setSending(false); }
  }

  const priorityColor = (p) => ({ urgent: "red", high: "yellow", normal: "blue", low: "gray" }[p] || "gray");

  return (
    <div className="space-y-4">
      <h2 className="text-white text-xl font-bold">Notifications</h2>
      <div className="flex gap-2 border-b border-purple-900/40">
        {[["list", "List"], ["send", "Send"], ["stats", "Stats"], ["templates", "Templates"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-medium ${tab === v ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {tab === "list" && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <input value={nSearch} onChange={e => setNSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadNotifs()}
              placeholder="Search…" className="flex-1 min-w-32 bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none" />
            <select value={nType} onChange={e => setNType(e.target.value)} className="bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="">All Types</option>
              <option value="system_alert">System Alert</option>
              <option value="booking_confirmed">Booking Confirmed</option>
              <option value="event_reminder">Event Reminder</option>
              <option value="achievement_unlocked">Achievement</option>
            </select>
            <select value={nStatus} onChange={e => setNStatus(e.target.value)} className="bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="read">Read</option>
              <option value="failed">Failed</option>
            </select>
            <select value={nPriority} onChange={e => setNPriority(e.target.value)} className="bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
            <select value={nChannel} onChange={e => setNChannel(e.target.value)} className="bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="">All Channels</option>
              <option value="push">Push</option>
              <option value="in_app">In-App</option>
              <option value="email">Email</option>
              <option value="all">All</option>
            </select>
            <Btn onClick={() => loadNotifs()}><Search size={14} /></Btn>
          </div>
          {notifsLoading ? <LoadingSpinner /> : (
            <>
              <TableWrap cols={["User", "Title", "Type", "Priority", "Status", "Channel", "Sent At", "Actions"]}>
                {notifs.map(n => (
                  <TR key={n.id}>
                    <TD>{n.user_email || n.recipient || "—"}</TD>
                    <TD><span className="text-white text-sm font-medium">{n.title}</span></TD>
                    <TD><span className="text-xs text-slate-400">{n.notification_type}</span></TD>
                    <TD><Badge color={priorityColor(n.priority)}>{n.priority}</Badge></TD>
                    <TD><Badge color={n.status === "read" ? "green" : n.status === "failed" ? "red" : "blue"}>{n.status}</Badge></TD>
                    <TD><span className="text-xs text-slate-400">{n.channel}</span></TD>
                    <TD>{n.sent_at ? new Date(n.sent_at).toLocaleDateString() : "—"}</TD>
                    <TD>
                      <div className="flex gap-1">
                        <Btn small color="gray" onClick={() => adminApi.notifications.detail(token, n.id).then(d => setNotifDetail(d?.data || d)).catch(e => showToast(e.message, "error"))}><Eye size={12} /></Btn>
                        <Btn small color="red" onClick={() => setConfirmDelNotif(n.id)}><Trash2 size={12} /></Btn>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TableWrap>
              <Pagination nextUrl={notifsNext} prevUrl={notifsPrev} onNext={() => loadNotifs(notifsNext)} onPrev={() => loadNotifs(notifsPrev)} />
            </>
          )}
        </div>
      )}

      {tab === "send" && (
        <div className="max-w-xl space-y-4">
          <div className="flex gap-2">
            {[["single", "Single User"], ["role", "By Role"], ["bulk", "Bulk"]].map(([v, l]) => (
              <button key={v} onClick={() => setSendMode(v)}
                className={`px-4 py-2 text-sm rounded-lg font-medium border ${sendMode === v ? "border-amber-400 text-amber-400" : "border-purple-900/40 text-slate-400 hover:text-white"}`}>{l}</button>
            ))}
          </div>
          {sendMode === "single" && <InputField label="User ID" value={sendForm.user_id} onChange={v => setSend("user_id", v)} />}
          {sendMode === "role" && (
            <div className="space-y-1">
              <label className="text-slate-300 text-xs font-medium">Role</label>
              <select value={sendForm.role} onChange={e => setSend("role", e.target.value)} className="w-full bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                <option value="">Select role</option>
                <option value="user">User</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          {sendMode === "bulk" && (
            <div className="space-y-1">
              <label className="text-slate-300 text-xs font-medium">User IDs (comma-separated)</label>
              <textarea value={sendForm.user_ids} onChange={e => setSend("user_ids", e.target.value)} rows={3}
                className="w-full bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none" placeholder="uuid1, uuid2, …" />
            </div>
          )}
          <InputField label="Title" value={sendForm.title} onChange={v => setSend("title", v)} />
          <div className="space-y-1">
            <label className="text-slate-300 text-xs font-medium">Body</label>
            <textarea value={sendForm.body} onChange={e => setSend("body", e.target.value)} rows={3}
              className="w-full bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none" placeholder="Notification message…" />
          </div>
          <InputField label="Type" value={sendForm.notification_type} onChange={v => setSend("notification_type", v)} />
          <InputField label="Deep Link (optional)" value={sendForm.deep_link} onChange={v => setSend("deep_link", v)} />
          <InputField label="Image URL (optional)" value={sendForm.image_url} onChange={v => setSend("image_url", v)} />
          {sendMode === "single" && <InputField label="Screen Name (optional)" value={sendForm.screen_name} onChange={v => setSend("screen_name", v)} />}
          <Btn onClick={submitSend} disabled={sending}>{sending ? "Sending…" : "Send Notification"}</Btn>
        </div>
      )}

      {tab === "stats" && (
        statsLoading ? <LoadingSpinner /> : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total" value={stats.overview?.total_notifications} icon={Bell} color={BRAND.primary} />
              <StatCard label="Sent" value={stats.overview?.sent_notifications} icon={Check} color={BRAND.info} />
              <StatCard label="Delivered" value={stats.overview?.delivered_notifications} icon={CheckCircle} color={BRAND.success} />
              <StatCard label="Read" value={stats.overview?.read_notifications} icon={Eye} color={BRAND.accent} />
              <StatCard label="Clicked" value={stats.overview?.clicked_notifications} icon={ArrowUpRight} color={BRAND.warning} />
              <StatCard label="Failed" value={stats.overview?.failed_notifications} icon={AlertTriangle} color={BRAND.error} />
            </div>
            {stats.notification_types?.length > 0 && (
              <div className="rounded-2xl p-4 border border-white/5" style={{ backgroundColor: BRAND.card }}>
                <h3 className="text-white font-bold mb-3">By Type</h3>
                <TableWrap cols={["Type", "Count"]}>
                  {stats.notification_types.map(t => (
                    <TR key={t.notification_type}>
                      <TD><span className="text-sm text-slate-300">{t.notification_type}</span></TD>
                      <TD><Badge color="blue">{t.count}</Badge></TD>
                    </TR>
                  ))}
                </TableWrap>
              </div>
            )}
          </div>
        ) : <p className="text-slate-500">No data</p>
      )}

      {tab === "templates" && (
        templatesLoading ? <LoadingSpinner /> : (
          <TableWrap cols={["Name", "Type", "Title Template", "Screen", "Active"]}>
            {templates.map(t => (
              <TR key={t.id}>
                <TD><span className="text-white">{t.name}</span></TD>
                <TD><span className="text-xs text-slate-400">{t.notification_type}</span></TD>
                <TD><span className="text-xs text-slate-300 max-w-xs truncate block">{t.title_template}</span></TD>
                <TD><span className="text-xs text-slate-400">{t.deep_link_template || t.screen_name || "—"}</span></TD>
                <TD><Badge color={t.is_active ? "green" : "gray"}>{t.is_active ? "Active" : "Inactive"}</Badge></TD>
              </TR>
            ))}
          </TableWrap>
        )
      )}

      {confirmDelNotif && <ConfirmModal message="Delete this notification?" onConfirm={() => deleteNotif(confirmDelNotif)} onCancel={() => setConfirmDelNotif(null)} />}
      {notifDetail && (
        <Modal title="Notification Detail" onClose={() => setNotifDetail(null)}>
          <div className="space-y-2">
            {[
              ["ID", notifDetail.id],
              ["Title", notifDetail.title],
              ["Body", notifDetail.body],
              ["Recipient", notifDetail.user_email || notifDetail.recipient],
              ["Type", notifDetail.notification_type],
              ["Priority", notifDetail.priority],
              ["Channel", notifDetail.channel],
              ["Status", notifDetail.status],
              ["Sent At", notifDetail.sent_at ? new Date(notifDetail.sent_at).toLocaleString() : null],
              ["Read At", notifDetail.read_at ? new Date(notifDetail.read_at).toLocaleString() : null],
              ["Created", notifDetail.created_at ? new Date(notifDetail.created_at).toLocaleString() : null],
            ].filter(([, v]) => v != null && v !== "").map(([label, val]) => (
              <div key={label} className="flex gap-4 text-sm">
                <span className="text-slate-400 w-32 shrink-0">{label}</span>
                <span className="text-white break-words">{String(val)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Btn onClick={() => setNotifDetail(null)} color="gray">Close</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default NotificationsView;
