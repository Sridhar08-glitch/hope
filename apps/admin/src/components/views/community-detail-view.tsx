"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  MicOff,
  UserMinus,
  Search,
  UsersRound,
  CheckCircle,
  MessageSquare,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import { motion } from "framer-motion";
import type { ApiClient } from "@holora/api-client";
import {
  PageHeader,
  TabBar,
  DataTable,
  TR,
  TD,
  StatCard,
  StatusBadge,
  SimplePagination,
  EmptyState,
  fadeUp,
  inputStyle,
} from "@/components/shared";

/* ── Types ─────────────────────────────────────────── */

interface DetailProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
  communityId: string;
  onBack: () => void;
}

interface CommunityData {
  name: string;
  description?: string;
  member_count?: number;
  active_today?: number | string;
  pending_reports?: number | string;
}

interface Member {
  id: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  role?: string;
  is_muted?: boolean;
}

interface Message {
  id: string;
  sender?: { name?: string; first_name?: string; email?: string };
  content?: string;
  text?: string;
  message_type?: string;
  moderation_status?: string;
  created_at?: string;
}

interface JoinRequest {
  id: string;
  user?: { first_name?: string; name?: string; email?: string };
  community?: { name?: string };
  status?: string;
  created_at?: string;
}

type Tab = "members" | "messages" | "join-requests";

/* ── Main View ─────────────────────────────────────── */

export default function CommunityDetailView({ api, showToast, communityId, onBack }: DetailProps) {
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("members");
  const [memberSearch, setMemberSearch] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersNext, setMembersNext] = useState<string | null>(null);
  const [membersPrev, setMembersPrev] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesNext, setMessagesNext] = useState<string | null>(null);
  const [messagesPrev, setMessagesPrev] = useState<string | null>(null);

  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinNext, setJoinNext] = useState<string | null>(null);
  const [joinPrev, setJoinPrev] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CommunityData>(`/admin/communities/${communityId}/`)
      .then(setCommunity)
      .catch((e: unknown) => showToast(e instanceof Error ? e.message : "Load failed", "error"))
      .finally(() => setLoading(false));
  }, [api, communityId, showToast]);

  const loadMembers = useCallback(
    async (url: string | null = null) => {
      setMembersLoading(true);
      try {
        const params: Record<string, string> = {};
        if (memberSearch) params.search = memberSearch;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = url ? await api.get(url) : await api.get(`/admin/communities/${communityId}/members/`, params);
        const data = res?.results || res || [];
        setMembers(Array.isArray(data) ? data : []);
        setMembersNext(res?.next || null);
        setMembersPrev(res?.previous || null);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Load failed", "error");
      } finally {
        setMembersLoading(false);
      }
    },
    [api, communityId, memberSearch, showToast],
  );

  const loadMessages = useCallback(
    async (url: string | null = null) => {
      setMessagesLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = url ? await api.get(url) : await api.get(`/admin/communities/${communityId}/messages/`);
        const data = res?.results || res || [];
        setMessages(Array.isArray(data) ? data : []);
        setMessagesNext(res?.next || null);
        setMessagesPrev(res?.previous || null);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Load failed", "error");
      } finally {
        setMessagesLoading(false);
      }
    },
    [api, communityId, showToast],
  );

  const loadJoinRequests = useCallback(
    async (url: string | null = null) => {
      setJoinLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = url ? await api.get(url) : await api.get("/admin/community-join-requests/");
        const data = res?.results || res || [];
        setJoinRequests(Array.isArray(data) ? data : []);
        setJoinNext(res?.next || null);
        setJoinPrev(res?.previous || null);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Load failed", "error");
      } finally {
        setJoinLoading(false);
      }
    },
    [api, showToast],
  );

  useEffect(() => {
    if (tab === "members") loadMembers();
    else if (tab === "messages") loadMessages();
    else if (tab === "join-requests") loadJoinRequests();
  }, [tab, loadMembers, loadMessages, loadJoinRequests]);

  async function muteUser(userId: string) {
    const hours = prompt("Mute duration (hours)?", "24");
    if (!hours) return;
    try {
      await api.post("/admin/moderation/mutes/", { user_id: userId, community_id: communityId, hours: parseInt(hours) });
      showToast("User muted", "success");
      loadMembers();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Mute failed", "error");
    }
  }

  async function banUser(userId: string) {
    try {
      await api.post("/admin/moderation/bans/", { user_id: userId, community_id: communityId });
      showToast("User banned from community", "success");
      loadMembers();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Ban failed", "error");
    }
  }

  async function handleJoinRequest(requestId: string, action: string) {
    try {
      await api.post(`/admin/community-join-requests/${requestId}/action/`, { action });
      showToast(`Request ${action}d`, "success");
      loadJoinRequests();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Action failed", "error");
    }
  }

  if (loading) return <Spinner />;
  if (!community) return <p className="text-[12px]" style={{ color: BRAND.error }}>Community not found</p>;

  const tabs: { key: Tab; label: string; icon: typeof UsersRound }[] = [
    { key: "members", label: "Members", icon: UsersRound },
    { key: "messages", label: "Messages", icon: MessageSquare },
    { key: "join-requests", label: "Join Requests", icon: UserPlus },
  ];

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-md hover:bg-white/5 transition" aria-label="Back">
          <ChevronLeft size={18} style={{ color: BRAND.textMuted }} />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold" style={{ color: BRAND.textMain }}>{community.name}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: BRAND.textDim }}>{community.description || "Community management"}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-3 gap-3">
        <StatCard label="Total Members" value={community.member_count ?? members.length} color={BRAND.primary} />
        <StatCard label="Active Today" value={community.active_today ?? "\u2014"} color={BRAND.success} />
        <StatCard label="Pending Reports" value={community.pending_reports ?? "\u2014"} color={BRAND.error} />
      </motion.div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* ── Members ── */}
      {tab === "members" && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadMembers()}
              placeholder="Search members..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-[12px] outline-none"
              style={inputStyle}
            />
          </div>
          {membersLoading ? <Spinner /> : members.length === 0 ? <EmptyState icon={UsersRound} message="No members found" /> : (
            <>
              <DataTable cols={["Member", "Role", "Status", "Moderation"]}>
                {members.map((m) => (
                  <TR key={m.id}>
                    <TD>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: BRAND.primary, color: BRAND.textMain }}>
                          {(m.first_name?.[0] || m.username?.[0] || "?").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[12px] font-medium" style={{ color: BRAND.textMain }}>{m.first_name || m.username || "Unknown"} {m.last_name || ""}</p>
                          <p className="text-[10px]" style={{ color: BRAND.textDim }}>{m.email || ""}</p>
                        </div>
                      </div>
                    </TD>
                    <TD><StatusBadge status={m.role || "member"} /></TD>
                    <TD>
                      {m.is_muted ? (
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: BRAND.warning }}><MicOff size={11} /> Muted</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: BRAND.success }}><CheckCircle size={11} /> Active</span>
                      )}
                    </TD>
                    <TD>
                      <div className="flex gap-1">
                        <button onClick={() => muteUser(m.id || m.user_id!)} className="p-1 rounded hover:bg-white/5 transition" title="Mute"><MicOff size={13} style={{ color: BRAND.warning }} /></button>
                        <button onClick={() => banUser(m.id || m.user_id!)} className="p-1 rounded hover:bg-white/5 transition" title="Ban"><UserMinus size={13} style={{ color: BRAND.error }} /></button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </DataTable>
              <SimplePagination prevUrl={membersPrev} nextUrl={membersNext} onPrev={() => loadMembers(membersPrev)} onNext={() => loadMembers(membersNext)} count={members.length} />
            </>
          )}
        </motion.div>
      )}

      {/* ── Messages ── */}
      {tab === "messages" && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          {messagesLoading ? <Spinner /> : messages.length === 0 ? <EmptyState icon={MessageSquare} message="No messages found" /> : (
            <>
              <DataTable cols={["Sender", "Message", "Type", "Status", "Date"]}>
                {messages.map((m) => (
                  <TR key={m.id}>
                    <TD>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: BRAND.primary, color: "#fff" }}>
                          {(m.sender?.name?.[0] || m.sender?.first_name?.[0] || "?").toUpperCase()}
                        </div>
                        <span className="text-[12px] font-medium" style={{ color: BRAND.textMain }}>{m.sender?.name || m.sender?.first_name || m.sender?.email || "Unknown"}</span>
                      </div>
                    </TD>
                    <TD><span className="text-[11px] max-w-[200px] truncate block" style={{ color: BRAND.textDim }}>{m.content || m.text || "\u2014"}</span></TD>
                    <TD><StatusBadge status={m.message_type || "text"} /></TD>
                    <TD><StatusBadge status={m.moderation_status || "pending"} /></TD>
                    <TD><span className="text-[10px]" style={{ color: BRAND.textDim }}>{m.created_at ? new Date(m.created_at).toLocaleString() : "\u2014"}</span></TD>
                  </TR>
                ))}
              </DataTable>
              <SimplePagination prevUrl={messagesPrev} nextUrl={messagesNext} onPrev={() => loadMessages(messagesPrev)} onNext={() => loadMessages(messagesNext)} count={messages.length} />
            </>
          )}
        </motion.div>
      )}

      {/* ── Join Requests ── */}
      {tab === "join-requests" && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          {joinLoading ? <Spinner /> : joinRequests.length === 0 ? <EmptyState icon={UserPlus} message="No pending join requests" /> : (
            <>
              <DataTable cols={["User", "Community", "Status", "Requested", "Actions"]}>
                {joinRequests.map((r) => (
                  <TR key={r.id}>
                    <TD>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: BRAND.primary, color: "#fff" }}>
                          {(r.user?.first_name?.[0] || r.user?.name?.[0] || "?").toUpperCase()}
                        </div>
                        <span className="text-[12px] font-medium" style={{ color: BRAND.textMain }}>{r.user?.first_name || r.user?.name || r.user?.email || "Unknown"}</span>
                      </div>
                    </TD>
                    <TD><span className="text-[11px]">{r.community?.name || "\u2014"}</span></TD>
                    <TD><StatusBadge status={r.status || "pending"} /></TD>
                    <TD><span className="text-[10px]" style={{ color: BRAND.textDim }}>{r.created_at ? new Date(r.created_at).toLocaleString() : "\u2014"}</span></TD>
                    <TD>
                      {(!r.status || r.status === "pending") && (
                        <div className="flex gap-1">
                          <button onClick={() => handleJoinRequest(r.id, "approve")} className="p-1 rounded hover:bg-white/5 transition" title="Approve"><Check size={13} style={{ color: BRAND.success }} /></button>
                          <button onClick={() => handleJoinRequest(r.id, "reject")} className="p-1 rounded hover:bg-white/5 transition" title="Reject"><X size={13} style={{ color: BRAND.error }} /></button>
                        </div>
                      )}
                    </TD>
                  </TR>
                ))}
              </DataTable>
              <SimplePagination prevUrl={joinPrev} nextUrl={joinNext} onPrev={() => loadJoinRequests(joinPrev)} onNext={() => loadJoinRequests(joinNext)} count={joinRequests.length} />
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
