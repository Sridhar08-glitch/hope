import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, MicOff, UserMinus, Search, UsersRound, Activity, ShieldAlert, CheckCircle, MessageSquare, UserPlus, Check, X } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner } from "../../components/ui";
import adminApi from "../../services/adminApi";

const TABS = [
  { id: "members", label: "Members", icon: UsersRound },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "join-requests", label: "Join Requests", icon: UserPlus },
];

function CommunityDetailView({ token, showToast, communityId, onBack }) {
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("members");
  const [memberSearch, setMemberSearch] = useState("");

  // Members from dedicated endpoint
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersNext, setMembersNext] = useState(null);
  const [membersPrev, setMembersPrev] = useState(null);

  // Messages
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesNext, setMessagesNext] = useState(null);
  const [messagesPrev, setMessagesPrev] = useState(null);

  // Join Requests
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinNext, setJoinNext] = useState(null);
  const [joinPrev, setJoinPrev] = useState(null);

  useEffect(() => {
    adminApi.communities.detail(token, communityId).then(setCommunity).catch(e => showToast(e.message, "error")).finally(() => setLoading(false));
  }, [token, communityId, showToast]);

  const loadMembers = useCallback(async (url = null) => {
    setMembersLoading(true);
    try {
      const res = url
        ? await adminApi.communities.members(token, communityId, {})
        : await adminApi.communities.members(token, communityId, { search: memberSearch || undefined });
      const data = res?.results || res || [];
      setMembers(Array.isArray(data) ? data : []);
      setMembersNext(res?.next || null);
      setMembersPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setMembersLoading(false); }
  }, [token, communityId, memberSearch, showToast]);

  const loadMessages = useCallback(async (url = null) => {
    setMessagesLoading(true);
    try {
      const res = url
        ? await adminApi.communities.messages(token, communityId, {})
        : await adminApi.communities.messages(token, communityId);
      const data = res?.results || res || [];
      setMessages(Array.isArray(data) ? data : []);
      setMessagesNext(res?.next || null);
      setMessagesPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setMessagesLoading(false); }
  }, [token, communityId, showToast]);

  const loadJoinRequests = useCallback(async (url = null) => {
    setJoinLoading(true);
    try {
      const res = url
        ? await adminApi.communities.joinRequests.listUrl(token, url)
        : await adminApi.communities.joinRequests.list(token);
      const data = res?.results || res || [];
      setJoinRequests(Array.isArray(data) ? data : []);
      setJoinNext(res?.next || null);
      setJoinPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setJoinLoading(false); }
  }, [token, showToast]);

  useEffect(() => {
    if (tab === "members") loadMembers();
    else if (tab === "messages") loadMessages();
    else if (tab === "join-requests") loadJoinRequests();
  }, [tab, loadMembers, loadMessages, loadJoinRequests]);

  async function muteUser(userId) {
    const hours = prompt("Mute duration (hours)?", "24");
    if (!hours) return;
    try {
      await adminApi.moderation.mutes.create(token, { user_id: userId, community_id: communityId, hours: parseInt(hours) });
      showToast("User muted", "success");
      loadMembers();
    } catch (err) { showToast(err.message, "error"); }
  }
  async function banUser(userId) {
    try {
      await adminApi.moderation.bans.create(token, { user_id: userId, community_id: communityId });
      showToast("User banned from community", "success");
      loadMembers();
    } catch (err) { showToast(err.message, "error"); }
  }
  async function handleJoinRequest(requestId, action) {
    try {
      await adminApi.communities.joinRequests.action(token, requestId, { action });
      showToast(`Request ${action}d`, "success");
      loadJoinRequests();
    } catch (err) { showToast(err.message, "error"); }
  }

  if (loading) return <LoadingSpinner />;
  if (!community) return <p className="text-red-400">Community not found</p>;

  return (
    <div className="space-y-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/10 transition text-white" style={{ backgroundColor: BRAND.panel }}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">{community.name}</h1>
          <p className="mt-1 text-sm" style={{ color: BRAND.textMuted }}>{community.description || "Community management"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Members", value: community.member_count ?? members.length, icon: UsersRound, color: "bg-purple-500/20 text-purple-400" },
          { label: "Active Today", value: community.active_today ?? "—", icon: Activity, color: "bg-green-500/20 text-green-400" },
          { label: "Pending Reports", value: community.pending_reports ?? "—", icon: ShieldAlert, color: "bg-red-500/20 text-red-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border p-6 shadow-xl flex items-center gap-4" style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}>
            <div className={`p-4 rounded-xl ${color}`}><Icon size={28} /></div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold" style={{ color: BRAND.textMuted }}>{label}</p>
              <h2 className="text-3xl font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: tab === t.id ? BRAND.primary : BRAND.panel, color: tab === t.id ? '#fff' : BRAND.textMuted, border: `1px solid ${BRAND.panelLight}` }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {tab === "members" && (
        <div className="rounded-2xl border flex-1 overflow-hidden flex flex-col shadow-xl" style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}>
          <div className="p-4 border-b flex flex-col md:flex-row justify-between md:items-center gap-3" style={{ borderColor: BRAND.panelLight }}>
            <h3 className="text-xl font-bold text-white">Members Directory</h3>
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
              <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search members..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/30 border focus:outline-none text-white text-sm"
                style={{ borderColor: BRAND.panelLight }}
                onKeyDown={e => e.key === 'Enter' && loadMembers()} />
            </div>
          </div>
          {membersLoading ? <div className="p-8 flex justify-center"><LoadingSpinner /></div> : (
            <>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-sm uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMuted }}>
                      <th className="p-4 font-medium">Member</th>
                      <th className="p-4 font-medium">Role</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-white/5">
                    {members.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center" style={{ color: BRAND.textMuted }}>No members found</td></tr>
                    ) : members.map(m => (
                      <tr key={m.id} className="hover:bg-black/20 transition group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0" style={{ backgroundColor: BRAND.primary, color: BRAND.textMain }}>
                              {(m.first_name?.[0] || m.username?.[0] || "?").toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-base">{m.first_name || m.username || "Unknown"} {m.last_name || ""}</p>
                              <p className="text-xs" style={{ color: BRAND.textMuted }}>{m.email || ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${
                            m.role === "admin" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                            m.role === "moderator" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                            "bg-white/5 text-gray-300 border-white/10"
                          }`}>{m.role || "member"}</span>
                        </td>
                        <td className="p-4">
                          {m.is_muted ? (
                            <span className="flex items-center gap-1 text-yellow-500 text-sm"><MicOff size={14} /> Muted</span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle size={14} /> Active</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => muteUser(m.id || m.user_id)} className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition" title="Mute"><MicOff size={16} /></button>
                            <button onClick={() => banUser(m.id || m.user_id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition" title="Ban"><UserMinus size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t flex justify-between items-center text-sm" style={{ borderColor: BRAND.panelLight, color: BRAND.textMuted }}>
                <span>Showing {members.length} members</span>
                <div className="flex gap-2">
                  <button onClick={() => loadMembers(membersPrev)} disabled={!membersPrev} className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 transition text-white disabled:opacity-40">Previous</button>
                  <button onClick={() => loadMembers(membersNext)} disabled={!membersNext} className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 transition text-white disabled:opacity-40">Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {tab === "messages" && (
        <div className="rounded-2xl border flex-1 overflow-hidden flex flex-col shadow-xl" style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}>
          <div className="p-4 border-b" style={{ borderColor: BRAND.panelLight }}>
            <h3 className="text-xl font-bold text-white">Community Messages</h3>
          </div>
          {messagesLoading ? <div className="p-8 flex justify-center"><LoadingSpinner /></div> : (
            <>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-sm uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMuted }}>
                      <th className="p-4 font-medium">Sender</th>
                      <th className="p-4 font-medium">Message</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-white/5">
                    {messages.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center" style={{ color: BRAND.textMuted }}>No messages found</td></tr>
                    ) : messages.map(m => (
                      <tr key={m.id} className="hover:bg-black/20 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: BRAND.primary, color: '#fff' }}>
                              {(m.sender?.name?.[0] || m.sender?.first_name?.[0] || "?").toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{m.sender?.name || m.sender?.first_name || m.sender?.email || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="p-4 max-w-xs truncate" style={{ color: BRAND.textMain }}>{m.content || m.text || "—"}</td>
                        <td className="p-4"><span className="px-2 py-1 rounded text-xs font-bold bg-white/5 text-gray-300">{m.message_type || "text"}</span></td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            m.moderation_status === "approved" ? "bg-green-500/20 text-green-400" :
                            m.moderation_status === "flagged" ? "bg-red-500/20 text-red-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>{m.moderation_status || "pending"}</span>
                        </td>
                        <td className="p-4 text-xs" style={{ color: BRAND.textMuted }}>{m.created_at ? new Date(m.created_at).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t flex justify-between items-center text-sm" style={{ borderColor: BRAND.panelLight, color: BRAND.textMuted }}>
                <span>Showing {messages.length} messages</span>
                <div className="flex gap-2">
                  <button onClick={() => loadMessages(messagesPrev)} disabled={!messagesPrev} className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 transition text-white disabled:opacity-40">Previous</button>
                  <button onClick={() => loadMessages(messagesNext)} disabled={!messagesNext} className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 transition text-white disabled:opacity-40">Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Join Requests Tab */}
      {tab === "join-requests" && (
        <div className="rounded-2xl border flex-1 overflow-hidden flex flex-col shadow-xl" style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}>
          <div className="p-4 border-b" style={{ borderColor: BRAND.panelLight }}>
            <h3 className="text-xl font-bold text-white">Pending Join Requests</h3>
          </div>
          {joinLoading ? <div className="p-8 flex justify-center"><LoadingSpinner /></div> : (
            <>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-sm uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMuted }}>
                      <th className="p-4 font-medium">User</th>
                      <th className="p-4 font-medium">Community</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Requested</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-white/5">
                    {joinRequests.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center" style={{ color: BRAND.textMuted }}>No pending join requests</td></tr>
                    ) : joinRequests.map(r => (
                      <tr key={r.id} className="hover:bg-black/20 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: BRAND.primary, color: '#fff' }}>
                              {(r.user?.first_name?.[0] || r.user?.name?.[0] || "?").toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{r.user?.first_name || r.user?.name || r.user?.email || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="p-4" style={{ color: BRAND.textMain }}>{r.community?.name || "—"}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            r.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                            r.status === "approved" ? "bg-green-500/20 text-green-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>{r.status || "pending"}</span>
                        </td>
                        <td className="p-4 text-xs" style={{ color: BRAND.textMuted }}>{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                        <td className="p-4 text-right">
                          {(!r.status || r.status === "pending") && (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleJoinRequest(r.id, "approve")}
                                className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition" title="Approve">
                                <Check size={16} />
                              </button>
                              <button onClick={() => handleJoinRequest(r.id, "reject")}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition" title="Reject">
                                <X size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t flex justify-between items-center text-sm" style={{ borderColor: BRAND.panelLight, color: BRAND.textMuted }}>
                <span>Showing {joinRequests.length} requests</span>
                <div className="flex gap-2">
                  <button onClick={() => loadJoinRequests(joinPrev)} disabled={!joinPrev} className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 transition text-white disabled:opacity-40">Previous</button>
                  <button onClick={() => loadJoinRequests(joinNext)} disabled={!joinNext} className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 transition text-white disabled:opacity-40">Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CommunityDetailView;
