import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, AlertTriangle, Shield, Clock, Ban, Phone, Video, Users, Flag } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, Btn, Pagination, Modal, InputField } from "../../components/ui";
import adminApi from "../../services/adminApi";

function ModerationView({ token, showToast }) {
  const [tab, setTab] = useState("reports");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [showCreateBan, setShowCreateBan] = useState(false);
  const [showCreateMute, setShowCreateMute] = useState(false);
  const [banForm, setBanForm] = useState({ user_id: "", community_id: "", reason: "", days: 7, permanent: false });
  const [muteForm, setMuteForm] = useState({ user_id: "", community_id: "", hours: 24, reason: "" });
  const [modStats, setModStats] = useState(null);
  const [msgSubTab, setMsgSubTab] = useState("community");
  const [msgId, setMsgId] = useState("");
  const [callStats, setCallStats] = useState(null);
  const [onlineData, setOnlineData] = useState(null);
  const [privateMsgs, setPrivateMsgs] = useState([]);
  const [pmNext, setPmNext] = useState(null);
  const [pmPrev, setPmPrev] = useState(null);

  const load = useCallback(async (url = null) => {
    setLoading(true);
    try {
      let res;
      if (tab === "messages") { setLoading(false); return; }
      if (tab === "calls") {
        const [statsRes, listRes] = await Promise.all([
          adminApi.moderation.calls.stats(token).catch(() => null),
          url ? adminApi.moderation.calls.listUrl(token, url) : adminApi.moderation.calls.list(token),
        ]);
        setCallStats(statsRes);
        setItems(listRes?.results || []);
        setNextUrl(listRes?.next || listRes?.next_cursor || null);
        setPrevUrl(listRes?.previous || listRes?.prev_cursor || null);
        setLoading(false);
        return;
      }
      if (tab === "online") {
        const res = await adminApi.moderation.onlineUsers(token);
        setOnlineData(res);
        setLoading(false);
        return;
      }
      if (tab === "privatemsgs") {
        const res = url ? await adminApi.moderation.privateMessages.listUrl(token, url) : await adminApi.moderation.privateMessages.list(token);
        setPrivateMsgs(res?.results || []);
        setPmNext(res?.next || res?.next_cursor || null);
        setPmPrev(res?.previous || res?.prev_cursor || null);
        setLoading(false);
        return;
      }
      if (url) {
        const api = tab === "reports" ? adminApi.moderation.reports : tab === "violations" ? adminApi.moderation.violations : tab === "bans" ? adminApi.moderation.bans : adminApi.moderation.mutes;
        res = await api.listUrl(token, url);
      } else {
        res = await (tab === "reports" ? adminApi.moderation.reports.list(token) : tab === "violations" ? adminApi.moderation.violations.list(token) : tab === "bans" ? adminApi.moderation.bans.list(token) : adminApi.moderation.mutes.list(token));
      }
      setItems(res?.results || (Array.isArray(res) ? res : []));
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }, [token, tab, showToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    adminApi.moderation.stats(token).then(setModStats).catch(() => { });
  }, [token]);

  async function resolve(id, action = "resolve") {
    try { await adminApi.moderation.reports.resolve(token, id, action); showToast(action === "resolve" ? "Report resolved" : "Report dismissed", "success"); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function moderateMessage(action) {
    if (!msgId.trim()) return;
    try {
      if (msgSubTab === "community") await adminApi.moderation.communityMessages.moderate(token, msgId.trim(), action);
      else await adminApi.moderation.privateMessages.moderate(token, msgId.trim(), action);
      showToast(`Message ${action}ged`, "success");
      setMsgId("");
    } catch (err) { showToast(err.message, "error"); }
  }
  async function deleteMessage() {
    if (!msgId.trim()) return;
    try {
      if (msgSubTab === "community") await adminApi.moderation.communityMessages.delete(token, msgId.trim());
      else await adminApi.moderation.privateMessages.delete(token, msgId.trim());
      showToast("Message deleted", "success");
      setMsgId("");
    } catch (err) { showToast(err.message, "error"); }
  }
  async function ignore(id) {
    try { await adminApi.moderation.violations.ignore(token, id); showToast("Violation ignored", "success"); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function removeBan(id) {
    try { await adminApi.moderation.bans.remove(token, id); showToast("Ban removed", "success"); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function removeMute(id) {
    try { await adminApi.moderation.mutes.remove(token, id); showToast("Mute removed", "success"); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function createBan() {
    try { await adminApi.moderation.bans.create(token, banForm); showToast("Ban created", "success"); setShowCreateBan(false); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function createMute() {
    try { await adminApi.moderation.mutes.create(token, muteForm); showToast("Mute created", "success"); setShowCreateMute(false); load(); }
    catch (err) { showToast(err.message, "error"); }
  }

  const tabs = ["reports", "violations", "bans", "mutes", "messages", "calls", "online", "privatemsgs"];
  const tabLabels = { reports: "Reports", violations: "Violations", bans: "Bans", mutes: "Mutes", messages: "Messages", calls: "Calls", online: "Online", privatemsgs: "Private Msgs" };

  return (
    <div className="space-y-6 flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Chat & Moderation</h1>
          <p className="mt-1 text-sm" style={{ color: BRAND.textMuted }}>Manage community messages, user reports, and bans.</p>
        </div>
        {(tab === "bans" || tab === "mutes") && (
          <button onClick={() => tab === "bans" ? setShowCreateBan(true) : setShowCreateMute(true)}
            style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
            className="px-4 py-2 font-bold rounded-lg hover:opacity-90 transition shadow-lg flex items-center gap-2">
            <Plus size={16} /> Create {tab === "bans" ? "Ban" : "Mute"}
          </button>
        )}
      </div>

      {/* Stats Row */}
      {modStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Pending Reports", value: modStats.total_reports_pending, icon: AlertTriangle, color: "bg-red-500/20 text-red-400" },
            { label: "Active Bans", value: modStats.total_bans_active, icon: Ban, color: "bg-orange-500/20 text-orange-400" },
            { label: "Active Mutes", value: modStats.total_mutes_active, icon: Clock, color: "bg-yellow-500/20 text-yellow-400" },
            { label: "Violations Today", value: modStats.total_violations_today, icon: Shield, color: "bg-purple-500/20 text-purple-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-white/5 p-5 shadow-xl flex items-center gap-4" style={{ backgroundColor: BRAND.panel }}>
              <div className={`p-3 rounded-xl ${color}`}><Icon size={22} /></div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Panel */}
      <div className="rounded-2xl border border-white/5 flex-1 overflow-hidden flex flex-col shadow-xl" style={{ backgroundColor: BRAND.panel }}>
        <div className="flex border-b" style={{ borderColor: BRAND.panelLight }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-4 text-sm font-bold uppercase tracking-wider capitalize transition"
              style={{ color: tab === t ? BRAND.accent : BRAND.textMuted, borderBottom: tab === t ? `2px solid ${BRAND.accent}` : "2px solid transparent", backgroundColor: tab === t ? "rgba(255,255,255,0.05)" : "transparent" }}>
              {tabLabels[t] || t}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {tab === "messages" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {[["community", "Community Messages"], ["private", "Private Messages"]].map(([v, l]) => (
                  <button key={v} onClick={() => setMsgSubTab(v)}
                    className="px-3 py-1.5 text-sm rounded-lg font-medium border transition-colors"
                    style={{ backgroundColor: msgSubTab === v ? BRAND.primary : "transparent", color: msgSubTab === v ? "#fff" : BRAND.textMuted, borderColor: BRAND.panelLight }}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="rounded-xl p-5 border border-white/5 space-y-4" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                <p className="text-slate-400 text-sm">No list endpoint — enter a Message ID to moderate directly.</p>
                <InputField label="Message ID" value={msgId} onChange={setMsgId} />
                <div className="flex gap-2 flex-wrap">
                  {msgSubTab === "community" ? (
                    <>
                      <Btn onClick={() => moderateMessage("flag")} color="yellow" small>Flag</Btn>
                      <Btn onClick={() => moderateMessage("unflag")} color="gray" small>Unflag</Btn>
                      <Btn onClick={() => moderateMessage("pin")} color="blue" small>Pin</Btn>
                      <Btn onClick={() => moderateMessage("unpin")} color="gray" small>Unpin</Btn>
                      <Btn onClick={deleteMessage} color="red" small><Trash2 size={12} className="inline mr-1" />Delete</Btn>
                    </>
                  ) : (
                    <>
                      <Btn onClick={() => moderateMessage("flag")} color="yellow" small>Flag</Btn>
                      <Btn onClick={() => moderateMessage("unflag")} color="gray" small>Unflag</Btn>
                      <Btn onClick={deleteMessage} color="red" small><Trash2 size={12} className="inline mr-1" />Delete</Btn>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "calls" && (loading ? <LoadingSpinner /> : (
            <div className="space-y-5">
              {callStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Total Calls", value: callStats.total_calls, icon: Phone, color: "bg-purple-500/20 text-purple-400" },
                    { label: "Answered", value: callStats.answered, icon: Phone, color: "bg-green-500/20 text-green-400" },
                    { label: "Missed", value: callStats.missed, icon: Phone, color: "bg-red-500/20 text-red-400" },
                    { label: "Avg Duration", value: `${Math.round(callStats.avg_duration_seconds || 0)}s`, icon: Clock, color: "bg-blue-500/20 text-blue-400" },
                    { label: "Voice", value: callStats.by_type?.voice ?? 0, icon: Phone, color: "bg-indigo-500/20 text-indigo-400" },
                    { label: "Video", value: callStats.by_type?.video ?? 0, icon: Video, color: "bg-pink-500/20 text-pink-400" },
                    { label: "Today", value: callStats.calls_today, icon: Clock, color: "bg-cyan-500/20 text-cyan-400" },
                    { label: "Last 7 Days", value: callStats.calls_last_7d, icon: Clock, color: "bg-yellow-500/20 text-yellow-400" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="rounded-xl p-4 border border-white/5 flex items-center gap-3" style={{ backgroundColor: BRAND.card }}>
                      <div className={`p-2 rounded-lg ${color}`}><Icon size={18} /></div>
                      <div>
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-lg font-bold text-white">{value ?? "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMuted }}>
                      <th className="p-4 font-medium">Caller</th>
                      <th className="p-4 font-medium">Receiver</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Duration</th>
                      <th className="p-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center" style={{ color: BRAND.textMuted }}>No calls found</td></tr>
                    ) : items.map(c => (
                      <tr key={c.id} className="hover:bg-black/20 transition">
                        <td className="p-4 text-white">{c.caller?.name || c.caller?.email || c.caller_id || "—"}</td>
                        <td className="p-4 text-white">{c.receiver?.name || c.receiver?.email || c.receiver_id || "—"}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${c.call_type === "video" ? "bg-pink-500/20 text-pink-400" : "bg-blue-500/20 text-blue-400"}`}>{c.call_type || "voice"}</span></td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${c.status === "completed" ? "bg-green-500/20 text-green-400" : c.status === "missed" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{c.status || "—"}</span></td>
                        <td className="p-4 text-gray-300">{c.duration ? `${Math.round(c.duration)}s` : "—"}</td>
                        <td className="p-4 text-gray-300 text-xs">{c.created_at ? new Date(c.created_at).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination nextUrl={nextUrl} prevUrl={prevUrl} onNext={() => load(nextUrl)} onPrev={() => load(prevUrl)} />
            </div>
          ))}

          {tab === "online" && (loading ? <LoadingSpinner /> : (
            <div className="space-y-4">
              <div className="rounded-xl p-5 border border-white/5 flex items-center gap-4" style={{ backgroundColor: BRAND.card }}>
                <div className="p-3 rounded-xl bg-green-500/20 text-green-400"><Users size={22} /></div>
                <div>
                  <p className="text-xs text-gray-400">Currently Online</p>
                  <p className="text-2xl font-bold text-white">{onlineData?.count ?? 0}</p>
                </div>
              </div>
              {onlineData?.online?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {onlineData.online.map((u, i) => (
                    <div key={u.id || i} className="rounded-xl p-4 border border-white/5 flex items-center gap-3" style={{ backgroundColor: BRAND.card }}>
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: BRAND.primary, color: '#fff' }}>
                          {(u.first_name?.[0] || u.name?.[0] || u.email?.[0] || "?").toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: BRAND.card }}></div>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{u.first_name || u.name || u.email || "Unknown"}</p>
                        <p className="text-xs" style={{ color: BRAND.textMuted }}>{u.email || u.role || ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8" style={{ color: BRAND.textMuted }}>No users online</p>
              )}
            </div>
          ))}

          {tab === "privatemsgs" && (loading ? <LoadingSpinner /> : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMuted }}>
                      <th className="p-4 font-medium">Sender</th>
                      <th className="p-4 font-medium">Receiver</th>
                      <th className="p-4 font-medium">Content</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {privateMsgs.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center" style={{ color: BRAND.textMuted }}>No private messages found</td></tr>
                    ) : privateMsgs.map(m => (
                      <tr key={m.id} className="hover:bg-black/20 transition">
                        <td className="p-4 text-white">{m.sender?.name || m.sender?.email || "—"}</td>
                        <td className="p-4 text-white">{m.receiver?.name || m.receiver?.email || "—"}</td>
                        <td className="p-4 text-gray-300"><span className="truncate max-w-xs block">{m.content || "—"}</span></td>
                        <td className="p-4"><span className="px-2 py-1 rounded text-xs font-bold bg-white/5 text-gray-300">{m.message_type || "text"}</span></td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${m.moderation_status === "approved" ? "bg-green-500/20 text-green-400" : m.moderation_status === "flagged" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                            {m.moderation_status || "pending"}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300 text-xs">{m.created_at ? new Date(m.created_at).toLocaleString() : "—"}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Btn onClick={async () => { try { await adminApi.moderation.privateMessages.moderate(token, m.id, "flag"); showToast("Flagged", "success"); load(); } catch (e) { showToast(e.message, "error"); } }} color="yellow" small><Flag size={12} /></Btn>
                            <Btn onClick={async () => { try { await adminApi.moderation.privateMessages.delete(token, m.id); showToast("Deleted", "success"); load(); } catch (e) { showToast(e.message, "error"); } }} color="red" small><Trash2 size={12} /></Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination nextUrl={pmNext} prevUrl={pmPrev} onNext={() => { setPmNext(null); load(pmNext); }} onPrev={() => { setPmPrev(null); load(pmPrev); }} />
            </div>
          ))}

          {!["messages","calls","online","privatemsgs"].includes(tab) && (loading ? <LoadingSpinner /> : (
            <>
              {tab === "reports" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMuted }}>
                        <th className="p-4 font-medium">Reporter</th>
                        <th className="p-4 font-medium">Reported User</th>
                        <th className="p-4 font-medium">Reason</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {items.map(r => (
                        <tr key={r.id} className="hover:bg-black/20 transition">
                          <td className="p-4 text-white">{r.reporter_name || r.reporter || "—"}</td>
                          <td className="p-4 text-white">{r.reported_user_name || r.reported_user || "—"}</td>
                          <td className="p-4 text-red-400 font-medium">{r.reason || r.report_type || "—"}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${r.is_resolved ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                              {r.is_resolved ? "Resolved" : "Pending"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {!r.is_resolved && (
                              <div className="flex justify-end gap-2">
                                <Btn onClick={() => resolve(r.id, "resolve")} color="green" small>Resolve</Btn>
                                <Btn onClick={() => resolve(r.id, "dismiss")} color="gray" small>Dismiss</Btn>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {tab === "violations" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMuted }}>
                        <th className="p-4 font-medium">User</th>
                        <th className="p-4 font-medium">Message</th>
                        <th className="p-4 font-medium">Severity</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {items.map(v => (
                        <tr key={v.id} className="hover:bg-black/20 transition">
                          <td className="p-4 text-white">{v.user_name || v.user || "—"}</td>
                          <td className="p-4 text-gray-300"><span className="truncate max-w-xs block">{v.message_content || v.content || "—"}</span></td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${v.severity === "high" ? "bg-red-500/20 text-red-400" : v.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400"}`}>
                              {v.severity || "—"}
                            </span>
                          </td>
                          <td className="p-4 text-right"><Btn onClick={() => ignore(v.id)} color="gray" small>Ignore</Btn></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {tab === "bans" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMuted }}>
                        <th className="p-4 font-medium">User</th>
                        <th className="p-4 font-medium">Community</th>
                        <th className="p-4 font-medium">Banned By</th>
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {items.map(b => (
                        <tr key={b.id} className="hover:bg-black/20 transition">
                          <td className="p-4 text-white">{b.user_name || b.user || "—"}</td>
                          <td className="p-4 text-gray-300">{b.community_name || b.community || "—"}</td>
                          <td className="p-4 text-gray-300">{b.banned_by_name || b.banned_by || "—"}</td>
                          <td className="p-4 text-gray-300">{b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}</td>
                          <td className="p-4 text-right"><Btn onClick={() => removeBan(b.id)} color="green" small>Remove</Btn></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {tab === "mutes" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMuted }}>
                        <th className="p-4 font-medium">User</th>
                        <th className="p-4 font-medium">Community</th>
                        <th className="p-4 font-medium">Duration</th>
                        <th className="p-4 font-medium">Expires</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {items.map(m => (
                        <tr key={m.id} className="hover:bg-black/20 transition">
                          <td className="p-4 text-white">{m.user_name || m.user || "—"}</td>
                          <td className="p-4 text-gray-300">{m.community_name || m.community || "—"}</td>
                          <td className="p-4 text-gray-300">{m.duration_hours ? `${m.duration_hours}h` : "—"}</td>
                          <td className="p-4 text-gray-300">{m.expires_at ? new Date(m.expires_at).toLocaleDateString() : "—"}</td>
                          <td className="p-4 text-right"><Btn onClick={() => removeMute(m.id)} color="green" small>Remove</Btn></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4">
                <Pagination nextUrl={nextUrl} prevUrl={prevUrl} onNext={() => load(nextUrl)} onPrev={() => load(prevUrl)} />
              </div>
            </>
          ))}
        </div>
      </div>

      {showCreateBan && (
        <Modal title="Create Community Ban" onClose={() => setShowCreateBan(false)}>
          <InputField label="User ID" value={banForm.user_id} onChange={v => setBanForm(f => ({ ...f, user_id: v }))} required />
          <InputField label="Community ID" value={banForm.community_id} onChange={v => setBanForm(f => ({ ...f, community_id: v }))} />
          <InputField label="Reason" value={banForm.reason} onChange={v => setBanForm(f => ({ ...f, reason: v }))} />
          <InputField label="Duration (days)" value={banForm.days} onChange={v => setBanForm(f => ({ ...f, days: parseInt(v) || 7 }))} type="number" />
          <div className="mb-4 flex items-center gap-3">
            <input type="checkbox" checked={banForm.permanent} onChange={e => setBanForm(f => ({ ...f, permanent: e.target.checked }))} id="ban_permanent" />
            <label htmlFor="ban_permanent" className="text-slate-400 text-sm">Permanent ban</label>
          </div>
          <div className="flex gap-3 justify-end">
            <Btn onClick={() => setShowCreateBan(false)} color="gray">Cancel</Btn>
            <Btn onClick={createBan}>Create Ban</Btn>
          </div>
        </Modal>
      )}
      {showCreateMute && (
        <Modal title="Create Community Mute" onClose={() => setShowCreateMute(false)}>
          <InputField label="User ID" value={muteForm.user_id} onChange={v => setMuteForm(f => ({ ...f, user_id: v }))} required />
          <InputField label="Community ID" value={muteForm.community_id} onChange={v => setMuteForm(f => ({ ...f, community_id: v }))} />
          <InputField label="Duration (hours)" value={muteForm.hours} onChange={v => setMuteForm(f => ({ ...f, hours: parseInt(v) || 24 }))} type="number" />
          <InputField label="Reason" value={muteForm.reason} onChange={v => setMuteForm(f => ({ ...f, reason: v }))} />
          <div className="flex gap-3 justify-end">
            <Btn onClick={() => setShowCreateMute(false)} color="gray">Cancel</Btn>
            <Btn onClick={createMute}>Create Mute</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ModerationView;
