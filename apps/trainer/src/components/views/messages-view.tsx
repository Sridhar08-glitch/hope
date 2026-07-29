"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from "react";
import { BRAND } from "@holora/ui";
import { trainerApi } from "@/lib/trainer-api";
import {
  Search,
  MessageSquare,
  ChevronLeft,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Pin,
  Star,
  Trash2,
  Pencil,
  Copy,
  Reply,
  SmilePlus,
  X,
  Check,
  CheckCheck,
  Users,
  VolumeX,
  Archive,
  Ban,
  Hash,
  Lock,
  Loader2,
  ChevronDown,
  AlertCircle,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Undo2,
  MessageCircleReply,
} from "lucide-react";

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

interface MessagesViewProps {
  communities: any[];
  selectedChat: any | null;
  chatMessages: any[];
  messageInput: string;
  profile: any;
  loading: boolean;
  onSelectChat: (chat: any) => void;
  onMessageInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  api?: any;
  showToast?: (message: string, type: "success" | "error") => void;
  socket?: any;
  webrtc?: any;
}

interface ChatListItem {
  id: string | number;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  type: "community" | "private";
  description?: string;
  members_count?: number;
  active_members_count?: number;
  is_joined?: boolean;
  other_user?: any;
  status?: string;
  last_message?: any;
  is_muted?: boolean;
}

/* ================================================================== */
/*  Constants                                                           */
/* ================================================================== */

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const AVATAR_COLORS = [
  "#7E22CE", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316",
];

/* ================================================================== */
/*  Helpers                                                             */
/* ================================================================== */

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0].toUpperCase();
}

function formatMessageTime(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatChatListTime(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const oneDay = 86400000;

  if (diff < oneDay && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 2 * oneDay) return "Yesterday";
  if (diff < 7 * oneDay) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getDateDivider(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - msgDate.getTime();

  if (diff === 0) return "Today";
  if (diff === 86400000) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function shouldShowDateDivider(messages: any[], index: number): boolean {
  if (index === 0) return true;
  const curr = messages[index]?.created_at || messages[index]?.timestamp;
  const prev = messages[index - 1]?.created_at || messages[index - 1]?.timestamp;
  if (!curr || !prev) return false;
  const d1 = new Date(curr);
  const d2 = new Date(prev);
  return (
    d1.getDate() !== d2.getDate() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getFullYear() !== d2.getFullYear()
  );
}

function getSenderName(msg: any): string {
  // Backend returns sender_name at top level and sender object with display_name/full_name
  return (
    msg.sender_name ||
    msg.sender?.display_name ||
    msg.sender?.full_name ||
    msg.sender?.display_label ||
    msg.sender?.name ||
    `${msg.sender?.first_name || ""} ${msg.sender?.last_name || ""}`.trim() ||
    "Unknown"
  );
}

function getChatName(chat: any): string {
  if (chat.type === "private") {
    if (chat.other_user) {
      return (
        chat.other_user.name ||
        chat.other_user.full_name ||
        `${chat.other_user.first_name || ""} ${chat.other_user.last_name || ""}`.trim() ||
        chat.other_user.email ||
        "Private Chat"
      );
    }
    return chat.name || "Private Chat";
  }
  return chat.name || "Community";
}

function getChatLastMessage(chat: any): string {
  if (chat.last_message) {
    const content = chat.last_message.content || chat.last_message.text || "";
    const senderName = getSenderName(chat.last_message);
    if (content.length > 40) {
      return `${senderName}: ${content.substring(0, 37)}...`;
    }
    return `${senderName}: ${content}`;
  }
  if (chat.description) {
    return chat.description.length > 50
      ? chat.description.substring(0, 47) + "..."
      : chat.description;
  }
  return "No messages yet";
}

function getChatLastMessageTime(chat: any): string {
  return (
    chat.last_message?.created_at ||
    chat.last_message?.timestamp ||
    chat.updated_at ||
    ""
  );
}

function isOwnMessage(msg: any, profile: any): boolean {
  // Backend returns is_own_message directly — use it first
  if (msg.is_own_message === true) return true;
  if (msg.is_own_message === false) return false;
  // Fallback: compare sender ID with profile (String() to avoid type mismatch)
  if (!profile || !msg.sender) return false;
  const senderId = String(msg.sender?.id ?? msg.sender_id ?? msg.senderId ?? "");
  const profileId = String(profile?.id ?? profile?.user_id ?? "");
  if (senderId && profileId && senderId === profileId) return true;
  return msg.sender?.email === profile?.email;
}

function truncate(str: string, len: number): string {
  if (!str) return "";
  return str.length > len ? str.substring(0, len - 3) + "..." : str;
}

/* ================================================================== */
/*  Mention-highlighted message text                                    */
/* ================================================================== */

function renderMessageText(text: string): ReactNode {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-semibold" style={{ color: BRAND.primary }}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

/* ================================================================== */
/*  Typing Dots Animation (CSS keyframes via style tag)                 */
/* ================================================================== */

function TypingDots() {
  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
      <span className="inline-flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: BRAND.textMuted,
              animation: `typingBounce 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </span>
    </>
  );
}

/* ================================================================== */
/*  Avatar Component                                                    */
/* ================================================================== */

function Avatar({
  name,
  size = 40,
  isOnline,
  imageUrl,
}: {
  name: string;
  size?: number;
  isOnline?: boolean;
  imageUrl?: string;
}) {
  const color = getAvatarColor(name);
  const initials = getInitials(name);
  const fontSize = size < 32 ? 10 : size < 44 ? 13 : 16;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center font-bold"
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            color: "#fff",
            fontSize,
          }}
        >
          {initials}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width: size < 36 ? 8 : 10,
            height: size < 36 ? 8 : 10,
            backgroundColor: isOnline ? BRAND.success : BRAND.textDim,
            borderColor: BRAND.surface,
          }}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  Scroll-to-bottom Button                                             */
/* ================================================================== */

function ScrollToBottomButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
      style={{
        backgroundColor: BRAND.primary,
        color: "#fff",
      }}
      aria-label="Scroll to bottom"
    >
      <ChevronDown size={20} />
    </button>
  );
}

/* ================================================================== */
/*  Delete Confirmation Inline                                          */
/* ================================================================== */

function DeleteConfirm({
  onDeleteForMe,
  onDeleteForEveryone,
  onCancel,
  isOwn,
}: {
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onCancel: () => void;
  isOwn: boolean;
}) {
  return (
    <div
      className="absolute z-50 rounded-lg shadow-2xl p-3 min-w-[200px]"
      style={{
        backgroundColor: BRAND.panel,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <p
        className="text-xs font-medium mb-2"
        style={{ color: BRAND.textMain }}
      >
        Delete message?
      </p>
      <div className="flex flex-col gap-1.5">
        <button
          onClick={onDeleteForMe}
          className="text-left text-xs px-3 py-1.5 rounded transition-colors hover:opacity-80"
          style={{
            color: BRAND.error,
            backgroundColor: "rgba(239,68,68,0.1)",
          }}
        >
          Delete for me
        </button>
        {isOwn && (
          <button
            onClick={onDeleteForEveryone}
            className="text-left text-xs px-3 py-1.5 rounded transition-colors hover:opacity-80"
            style={{
              color: BRAND.error,
              backgroundColor: "rgba(239,68,68,0.15)",
            }}
          >
            Delete for everyone
          </button>
        )}
        <button
          onClick={onCancel}
          className="text-left text-xs px-3 py-1.5 rounded transition-colors hover:opacity-80"
          style={{ color: BRAND.textMuted }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Emoji Reaction Picker (Quick 6)                                     */
/* ================================================================== */

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-0.5 rounded-full px-2 py-1 shadow-xl"
      style={{
        backgroundColor: BRAND.panel,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:scale-125 transition-transform text-base"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Emoji Reactions Display Row                                         */
/* ================================================================== */

function ReactionsRow({
  reactions,
  onReact,
}: {
  reactions: any[];
  onReact: (emoji: string) => void;
}) {
  if (!reactions) return null;

  // Handle both formats: array of { emoji, user } OR object { "👍": 2 }
  const grouped: Record<string, { emoji: string; count: number; users: string[] }> = {};

  if (Array.isArray(reactions)) {
    if (reactions.length === 0) return null;
    for (const r of reactions) {
      const key = r.emoji || r.reaction;
      if (!key) continue;
      if (!grouped[key]) grouped[key] = { emoji: key, count: 0, users: [] };
      grouped[key].count += 1;
      if (r.user?.name || r.user?.first_name) {
        grouped[key].users.push(r.user.name || r.user.first_name);
      }
    }
  } else if (typeof reactions === "object") {
    // Object format: { "👍": 2, "❤️": 1 } or { "👍": { count: 2 } }
    for (const [emoji, value] of Object.entries(reactions)) {
      const count = typeof value === "number" ? value : (value as any)?.count || 1;
      if (count > 0) grouped[emoji] = { emoji, count, users: [] };
    }
  } else {
    return null;
  }

  const entries = Object.values(grouped);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onReact(r.emoji)}
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] transition-colors hover:opacity-80"
          style={{
            backgroundColor: "rgba(126,34,206,0.15)",
            border: `1px solid ${BRAND.border}`,
            color: BRAND.textMuted,
          }}
          title={r.users.length > 0 ? r.users.join(", ") : undefined}
        >
          <span>{r.emoji}</span>
          {r.count > 1 && <span>{r.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Reply Preview (in message bubble)                                   */
/* ================================================================== */

function ReplyPreview({ replyTo }: { replyTo: any }) {
  if (!replyTo) return null;
  const senderName = getSenderName(replyTo);
  const content = replyTo.content || replyTo.text || "";

  return (
    <div
      className="rounded px-2 py-1 mb-1.5 text-[11px] border-l-2 cursor-pointer"
      style={{
        backgroundColor: "rgba(126,34,206,0.1)",
        borderLeftColor: BRAND.accent,
        color: BRAND.textMuted,
      }}
    >
      <span className="font-semibold" style={{ color: BRAND.accent }}>
        {senderName}
      </span>
      <p className="truncate mt-0.5">{truncate(content, 80)}</p>
    </div>
  );
}

/* ================================================================== */
/*  Message Actions Overlay                                             */
/* ================================================================== */

function MessageActions({
  isOwn,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onStar,
  onCopy,
  onReact,
}: {
  isOwn: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onStar: () => void;
  onCopy: () => void;
  onReact: () => void;
}) {
  const btnClass =
    "w-7 h-7 flex items-center justify-center rounded transition-colors hover:opacity-80";

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg px-1 py-0.5 shadow-xl"
      style={{
        backgroundColor: BRAND.panel,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <button
        onClick={onReact}
        className={btnClass}
        style={{ color: BRAND.textMuted }}
        title="React"
      >
        <SmilePlus size={14} />
      </button>
      <button
        onClick={onReply}
        className={btnClass}
        style={{ color: BRAND.textMuted }}
        title="Reply"
      >
        <Reply size={14} />
      </button>
      {isOwn && (
        <button
          onClick={onEdit}
          className={btnClass}
          style={{ color: BRAND.textMuted }}
          title="Edit"
        >
          <Pencil size={14} />
        </button>
      )}
      <button
        onClick={onPin}
        className={btnClass}
        style={{ color: BRAND.textMuted }}
        title="Pin"
      >
        <Pin size={14} />
      </button>
      <button
        onClick={onStar}
        className={btnClass}
        style={{ color: BRAND.textMuted }}
        title="Star"
      >
        <Star size={14} />
      </button>
      <button
        onClick={onCopy}
        className={btnClass}
        style={{ color: BRAND.textMuted }}
        title="Copy"
      >
        <Copy size={14} />
      </button>
      {isOwn && (
        <button
          onClick={onDelete}
          className={btnClass}
          style={{ color: BRAND.error }}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Date Divider                                                        */
/* ================================================================== */

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-4 px-2">
      <div className="flex-1 h-px" style={{ backgroundColor: BRAND.border }} />
      <span
        className="text-[11px] font-medium px-3 py-1 rounded-full shrink-0"
        style={{
          color: BRAND.textMuted,
          backgroundColor: BRAND.surface,
          border: `1px solid ${BRAND.border}`,
        }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: BRAND.border }} />
    </div>
  );
}

/* ================================================================== */
/*  Delivery Status Ticks                                               */
/* ================================================================== */

function DeliveryTicks({ status }: { status?: string }) {
  if (!status) {
    return (
      <Check
        size={12}
        style={{ color: BRAND.textDim }}
        className="inline-block ml-1"
      />
    );
  }

  if (status === "read") {
    return (
      <CheckCheck
        size={12}
        style={{ color: "#3b82f6" }}
        className="inline-block ml-1"
      />
    );
  }

  if (status === "delivered") {
    return (
      <CheckCheck
        size={12}
        style={{ color: BRAND.textDim }}
        className="inline-block ml-1"
      />
    );
  }

  // sent
  return (
    <Check
      size={12}
      style={{ color: BRAND.textDim }}
      className="inline-block ml-1"
    />
  );
}

/* ================================================================== */
/*  Pinned Messages Panel                                               */
/* ================================================================== */

function PinnedMessagesPanel({
  messages,
  onClose,
}: {
  messages: any[];
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{ backgroundColor: BRAND.bg }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          borderColor: BRAND.border,
          backgroundColor: BRAND.surface,
        }}
      >
        <div className="flex items-center gap-2">
          <Pin size={16} style={{ color: BRAND.accent }} />
          <span className="font-semibold text-sm" style={{ color: BRAND.textMain }}>
            Pinned Messages
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: BRAND.primary, color: "#fff" }}
          >
            {messages.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
          style={{ color: BRAND.textMuted }}
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Pin size={32} className="mx-auto mb-3" style={{ color: BRAND.textDim }} />
            <p className="text-sm" style={{ color: BRAND.textMuted }}>
              No pinned messages
            </p>
          </div>
        ) : (
          messages.map((msg: any) => (
            <div
              key={msg.id}
              className="rounded-lg p-3"
              style={{
                backgroundColor: BRAND.panel,
                border: `1px solid ${BRAND.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold" style={{ color: BRAND.accent }}>
                  {getSenderName(msg)}
                </span>
                <span className="text-[10px]" style={{ color: BRAND.textDim }}>
                  {formatMessageTime(msg.created_at || msg.timestamp)}
                </span>
              </div>
              <p className="text-sm" style={{ color: BRAND.textMain }}>
                {msg.content || msg.text || ""}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Members Panel                                                       */
/* ================================================================== */

function MembersPanel({
  members,
  onClose,
}: {
  members: any[];
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{ backgroundColor: BRAND.bg }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          borderColor: BRAND.border,
          backgroundColor: BRAND.surface,
        }}
      >
        <div className="flex items-center gap-2">
          <Users size={16} style={{ color: BRAND.accent }} />
          <span className="font-semibold text-sm" style={{ color: BRAND.textMain }}>
            Members
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: BRAND.primary, color: "#fff" }}
          >
            {members.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
          style={{ color: BRAND.textMuted }}
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {members.map((member: any, idx: number) => {
          const memberName =
            member.user?.full_name ||
            member.user?.display_name ||
            member.user?.display_label ||
            member.name ||
            member.full_name ||
            `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
            member.email ||
            "Unknown";
          const memberAvatar =
            member.user?.profile_photo_url ||
            member.user?.profile_photo ||
            member.avatar_url;
          const role = member.role || member.membership_type || "member";

          return (
            <div
              key={member.id || idx}
              className="flex items-center gap-3 p-2.5 rounded-lg transition-colors"
              style={{ color: BRAND.textMain }}
            >
              <Avatar name={memberName} size={36} isOnline={member.is_online} imageUrl={memberAvatar} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{memberName}</p>
                {role && (
                  <p className="text-[11px] capitalize" style={{ color: BRAND.textDim }}>
                    {role}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Header More Menu (Dropdown)                                         */
/* ================================================================== */

function HeaderMoreMenu({
  chatType,
  onMute,
  onArchive,
  onPinned,
  onMembers,
  onClear,
  onBlock,
  onClose,
}: {
  chatType: "community" | "private";
  onMute: () => void;
  onArchive: () => void;
  onPinned: () => void;
  onMembers: () => void;
  onClear: () => void;
  onBlock: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items = [
    { icon: VolumeX, label: "Mute", action: onMute },
    { icon: Archive, label: "Archive", action: onArchive },
    { icon: Pin, label: "Pinned messages", action: onPinned },
    ...(chatType === "community"
      ? [{ icon: Users, label: "Members", action: onMembers }]
      : []),
    { icon: Trash2, label: "Clear chat", action: onClear },
    ...(chatType === "private"
      ? [{ icon: Ban, label: "Block", action: onBlock }]
      : []),
  ];

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-50 rounded-lg shadow-2xl py-1 min-w-[180px]"
      style={{
        backgroundColor: BRAND.panel,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => {
            item.action();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors text-left hover:opacity-80"
          style={{
            color: item.label === "Block" || item.label === "Clear chat"
              ? BRAND.error
              : BRAND.textMain,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(255,255,255,0.03)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }}
        >
          <item.icon size={15} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Chat List Item                                                      */
/* ================================================================== */

function ChatListItemComponent({
  chat,
  isSelected,
  onClick,
}: {
  chat: ChatListItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const name = getChatName(chat);
  const lastMsg = getChatLastMessage(chat);
  const lastTime = formatChatListTime(getChatLastMessageTime(chat));
  const unread = chat.unreadCount || chat.last_message?.unread_count || 0;
  const isCommunity = chat.type === "community";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
      style={{
        backgroundColor: isSelected ? "rgba(126,34,206,0.12)" : "transparent",
        borderLeft: isSelected ? `3px solid ${BRAND.primary}` : "3px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "rgba(255,255,255,0.03)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
        }
      }}
    >
      <div className="relative">
        <Avatar
          name={name}
          size={42}
          isOnline={!isCommunity ? chat.isOnline : undefined}
          imageUrl={chat.avatar || chat.other_user?.profile_image}
        />
        {isCommunity && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: BRAND.primary }}
          >
            <Hash size={10} style={{ color: "#fff" }} />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className="text-sm font-semibold truncate max-w-[140px]"
            style={{ color: BRAND.textMain }}
          >
            {name}
          </span>
          {lastTime && (
            <span className="text-[10px] shrink-0 ml-1" style={{ color: BRAND.textDim }}>
              {lastTime}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span
            className="text-xs truncate max-w-[160px]"
            style={{
              color: unread > 0 ? BRAND.textMuted : BRAND.textDim,
              fontWeight: unread > 0 ? 500 : 400,
            }}
          >
            {lastMsg}
          </span>
          {unread > 0 && (
            <span
              className="shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold ml-1"
              style={{ backgroundColor: BRAND.primary, color: "#fff" }}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ================================================================== */
/*  Private Chat Request Item (pending accept/reject)                   */
/* ================================================================== */

function PendingChatItem({
  chat,
  onAccept,
  onReject,
}: {
  chat: any;
  onAccept: () => void;
  onReject: () => void;
}) {
  const name = getChatName({ ...chat, type: "private" });

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{ backgroundColor: "rgba(126,34,206,0.06)" }}
    >
      <Avatar
        name={name}
        size={42}
        imageUrl={chat.other_user?.profile_image}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: BRAND.textMain }}
        >
          {name}
        </p>
        <p className="text-[11px]" style={{ color: BRAND.textDim }}>
          Chat request
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAccept();
          }}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
          style={{ backgroundColor: BRAND.success, color: "#fff" }}
          title="Accept"
        >
          <Check size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReject();
          }}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
          style={{ backgroundColor: BRAND.error, color: "#fff" }}
          title="Reject"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Single Message Bubble                                               */
/* ================================================================== */

function MessageBubble({
  msg,
  isOwn,
  profile,
  hoveredId,
  showEmojiFor,
  deletingId,
  onHover,
  onLeave,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onStar,
  onCopy,
  onReact,
  onToggleEmoji,
  onDeleteForMe,
  onDeleteForEveryone,
  onCancelDelete,
}: {
  msg: any;
  isOwn: boolean;
  profile: any;
  hoveredId: string | null;
  showEmojiFor: string | null;
  deletingId: string | null;
  onHover: (id: string) => void;
  onLeave: () => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onStar: () => void;
  onCopy: () => void;
  onReact: (emoji: string) => void;
  onToggleEmoji: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onCancelDelete: () => void;
}) {
  const msgId = String(msg.id);
  const isHovered = hoveredId === msgId;
  const senderName = getSenderName(msg);
  const senderColor = getAvatarColor(senderName);
  const content = msg.content || msg.text || "";
  const time = formatMessageTime(msg.created_at || msg.timestamp);
  const isEdited = msg.is_edited || msg.edited;
  const replyTo = msg.reply_to || msg.parent_message || msg.replied_to;
  const reactions = msg.reactions || [];
  const isPinned = msg.is_pinned || msg.pinned;
  const isStarred = msg.is_starred || msg.starred;
  const status = msg.delivery_status || msg.status || (msg.is_read ? "read" : msg.is_delivered ? "delivered" : "sent");

  // Deleted message
  if (msg.is_deleted || msg.is_deleted_for_everyone || msg.is_deleted_by_sender || msg.deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-2 md:px-4`}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg italic text-xs"
          style={{ color: BRAND.textDim }}
        >
          <AlertCircle size={12} />
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} px-2 md:px-4 group relative`}
      onMouseEnter={() => onHover(msgId)}
      onMouseLeave={onLeave}
    >
      {/* Other user avatar */}
      {!isOwn && (
        <div className="mr-2 mt-1 hidden md:block">
          <Avatar
            name={senderName}
            size={32}
            imageUrl={msg.sender?.profile_photo_url || msg.sender?.profile_photo || msg.sender?.profile_image || msg.sender_profile_photo || msg.sender?.avatar}
          />
        </div>
      )}

      <div className={`relative max-w-[85%] md:max-w-[65%]`}>
        {/* Actions bar on hover */}
        {isHovered && (
          <div
            className={`absolute z-20 ${isOwn ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"}`}
            style={{ top: -4 }}
          >
            <MessageActions
              isOwn={isOwn}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
              onStar={onStar}
              onCopy={onCopy}
              onReact={onToggleEmoji}
            />
          </div>
        )}

        {/* Emoji picker above message */}
        {showEmojiFor === msgId && (
          <div
            className={`absolute z-30 ${isOwn ? "right-0" : "left-0"}`}
            style={{ top: -44 }}
          >
            <EmojiPicker
              onSelect={onReact}
              onClose={onToggleEmoji}
            />
          </div>
        )}

        {/* Delete confirm */}
        {deletingId === msgId && (
          <div
            className={`absolute z-30 ${isOwn ? "right-0" : "left-0"}`}
            style={{ top: -8, transform: "translateY(-100%)" }}
          >
            <DeleteConfirm
              isOwn={isOwn}
              onDeleteForMe={onDeleteForMe}
              onDeleteForEveryone={onDeleteForEveryone}
              onCancel={onCancelDelete}
            />
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-3 py-2 ${
            isOwn ? "rounded-tr-sm" : "rounded-tl-sm"
          }`}
          style={{
            background: isOwn
              ? `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})`
              : BRAND.panel,
            border: isOwn ? "none" : `1px solid ${BRAND.border}`,
          }}
        >
          {/* Pinned/starred indicators */}
          {(isPinned || isStarred) && (
            <div className="flex items-center gap-2 mb-1">
              {isPinned && (
                <span className="flex items-center gap-0.5 text-[10px]" style={{ color: BRAND.accent }}>
                  <Pin size={9} /> Pinned
                </span>
              )}
              {isStarred && (
                <span className="flex items-center gap-0.5 text-[10px]" style={{ color: BRAND.accent }}>
                  <Star size={9} /> Starred
                </span>
              )}
            </div>
          )}

          {/* Sender name (others only) */}
          {!isOwn && (
            <p
              className="text-xs font-semibold mb-0.5"
              style={{ color: senderColor }}
            >
              {senderName}
            </p>
          )}

          {/* Reply quote */}
          {replyTo && <ReplyPreview replyTo={replyTo} />}

          {/* Message content */}
          <p className="text-sm whitespace-pre-wrap break-words" style={{ color: "#fff" }}>
            {renderMessageText(content)}
          </p>

          {/* Timestamp + status row */}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
            {isEdited && (
              <span className="text-[10px] italic" style={{ color: "rgba(255,255,255,0.4)" }}>
                (edited)
              </span>
            )}
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              {time}
            </span>
            {isOwn && <DeliveryTicks status={status} />}
          </div>
        </div>

        {/* Reactions row below bubble */}
        <ReactionsRow reactions={reactions} onReact={onReact} />

        {/* Thread replies badge (community root messages) */}
        {!msg.thread_root_id && (msg.thread_reply_count || 0) > 0 && (
          <div
            className="flex items-center gap-1 text-[10px] mt-0.5 px-2 py-0.5 rounded-full w-fit cursor-pointer"
            style={{ backgroundColor: `${BRAND.primary}20`, color: BRAND.primary }}
          >
            <MessageCircleReply size={10} />
            {msg.thread_reply_count} {msg.thread_reply_count === 1 ? "reply" : "replies"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Empty Conversation State                                            */
/* ================================================================== */

function EmptyConversation() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center px-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: BRAND.surface }}
        >
          <MessageSquare size={32} style={{ color: BRAND.textDim }} />
        </div>
        <p className="text-lg font-semibold mb-1" style={{ color: BRAND.textMain }}>
          Select a conversation
        </p>
        <p className="text-sm" style={{ color: BRAND.textDim }}>
          Choose a community or private chat to start messaging
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  No Messages State (inside a chat)                                   */
/* ================================================================== */

function NoMessages({ chatName }: { chatName: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center px-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: BRAND.surface }}
        >
          <MessageSquare size={28} style={{ color: BRAND.textDim }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: BRAND.textMuted }}>
          No messages yet in {chatName}
        </p>
        <p className="text-xs" style={{ color: BRAND.textDim }}>
          Start the conversation!
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                      */
/* ================================================================== */

export function MessagesView({
  communities,
  selectedChat,
  chatMessages,
  messageInput,
  profile,
  loading,
  onSelectChat,
  onMessageInputChange,
  onSendMessage,
  api,
  showToast,
  socket,
  webrtc,
}: MessagesViewProps) {
  /* ── Internal state ─────────────────────────────────────────────── */
  const [privateChats, setPrivateChats] = useState<any[]>([]);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [chatSearch, setChatSearch] = useState("");
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [editText, setEditText] = useState("");
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [chatType, setChatType] = useState<"community" | "private">("community");
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [communityMembers, setCommunityMembers] = useState<any[]>([]);
  const [loadingPrivateChats, setLoadingPrivateChats] = useState(false);
  const [privateMessagesMap, setPrivateMessagesMap] = useState<Record<string, any[]>>({});
  const [presenceCache, setPresenceCache] = useState<Record<string, any>>({});
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [internalMsgInput, setInternalMsgInput] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [lastDeleted, setLastDeleted] = useState<{ id: string; type: "private" | "community"; chatId: string | number; expiresAt: number } | null>(null);

  /* ── Refs ────────────────────────────────────────────────────────── */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDeletedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Derived state ──────────────────────────────────────────────── */
  const currentChatType = selectedChat?.type || chatType;

  // Display messages — SEPARATE handling for private vs community (never mixed)
  const displayMessages = useMemo(() => {
    let msgs: any[];

    if (currentChatType === "private" && selectedChat) {
      // PRIVATE: use only privateMessagesMap — never chatMessages or localMessages
      const key = String(selectedChat.id);
      msgs = [...(privateMessagesMap[key] || [])];
    } else {
      // COMMUNITY: combine parent REST messages + WS-added localMessages
      // chatMessages = REST-loaded history; localMessages = real-time WS additions + optimistic
      const parentIdSet = new Set((chatMessages || []).map((m: any) => String(m.id)));
      const wsOnlyMsgs = (localMessages || []).filter(
        (m: any) => !parentIdSet.has(String(m.id))
      );
      msgs = [...(chatMessages || []), ...wsOnlyMsgs];
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    msgs = msgs.filter((m) => {
      const id = String(m.id || m.message_id);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // Sort oldest → newest (latest at bottom)
    return msgs.sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return ta - tb;
    });
  }, [chatMessages, localMessages, currentChatType, selectedChat, privateMessagesMap]);

  // Build the unified chat list
  const allCommunities: ChatListItem[] = useMemo(() => {
    return (communities || [])
      .filter((c: any) => c.is_joined !== false) // Only show joined communities
      .map((c: any) => ({
        ...c,
        type: "community" as const,
      }));
  }, [communities]);

  const allPrivateChats: ChatListItem[] = useMemo(() => {
    return (privateChats || []).map((c: any) => ({
      ...c,
      type: "private" as const,
      isOnline: presenceCache[(c as any).other_user_uuid || (c as any).user?.user_id || (c as any).other_user_id]?.is_online ?? (c as any).other_user?.is_online ?? (c as any).user?.is_online ?? false,
    }));
  }, [privateChats, presenceCache]);

  const pendingChats = useMemo(() => {
    return allPrivateChats.filter(
      (c) => c.status === "pending" || c.status === "requested"
    );
  }, [allPrivateChats]);

  const activePrivateChats = useMemo(() => {
    return allPrivateChats.filter(
      (c) => c.status !== "pending" && c.status !== "requested"
    );
  }, [allPrivateChats]);

  // Filter by search
  const filteredCommunities = useMemo(() => {
    if (!localSearch) return allCommunities;
    const q = localSearch.toLowerCase();
    return allCommunities.filter(
      (c) =>
        getChatName(c).toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    );
  }, [allCommunities, localSearch]);

  const filteredPrivateChats = useMemo(() => {
    if (!localSearch) return activePrivateChats;
    const q = localSearch.toLowerCase();
    return activePrivateChats.filter((c) =>
      getChatName(c).toLowerCase().includes(q)
    );
  }, [activePrivateChats, localSearch]);

  const filteredPendingChats = useMemo(() => {
    if (!localSearch) return pendingChats;
    const q = localSearch.toLowerCase();
    return pendingChats.filter((c) =>
      getChatName(c).toLowerCase().includes(q)
    );
  }, [pendingChats, localSearch]);

  /* ── Load private chats + archived via sidebar endpoint ────────── */
  const [archivedChats, setArchivedChats] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  // Flatten sidebar response into chat list items
  const flattenSidebarChats = useCallback((data: any) => {
    const privateChats = (data?.private_chats || data?.data?.private_chats || []).map((c: any) => ({
      id: c.room_id || c.id,
      name: c.user?.full_name || c.user?.display_name || c.user?.username || c.partner?.full_name || c.partner_name || "Private Chat",
      avatar_url: c.user?.profile_image || c.user?.profile_photo_url || c.user?.profile_photo || c.partner?.profile_photo || null,
      other_user_id: c.user?.id || c.user?.user_id || c.partner?.id || c.partner_id,
      other_user_uuid: c.user?.user_id || c.partner?.user_id || null,
      last_message: c.last_message,
      last_message_time: c.last_message_time,
      unread_count: c.unread_count || 0,
      is_muted: c.is_muted || false,
      is_archived: c.is_archived || false,
      type: "private" as const,
      ...c,
    }));
    const communityChats = (data?.community_chats || data?.data?.community_chats || []).map((c: any) => ({
      id: c.community?.id || c.id,
      name: c.community?.name || c.name || "Community",
      description: c.community?.description || c.description || "",
      avatar_url: c.community?.profile_photo || null,
      member_count: c.community?.member_count || 0,
      active_members_count: c.community?.active_members_count || 0,
      is_joined: c.community?.is_joined ?? true,
      last_message: c.last_message || c.community?.latest_message?.content,
      last_message_time: c.last_message_time || c.community?.latest_message?.created_at,
      unread_count: c.unread_count || 0,
      community_archived: c.community_archived || false,
      archived_for_me: c.archived_for_me || false,
      type: "community" as const,
      ...c,
    }));
    return { privateChats, communityChats };
  }, []);

  useEffect(() => {
    if (!api) { setLoadingPrivateChats(false); return; }
    const loadSidebar = async () => {
      setLoadingPrivateChats(true);
      try {
        const data = await trainerApi.chat.getSidebar(api);
        const { privateChats: pChats } = flattenSidebarChats(data);
        setPrivateChats(pChats);
      } catch {
        // silent — sidebar may not be available
      } finally {
        setLoadingPrivateChats(false);
      }
    };
    loadSidebar();
  }, [api, flattenSidebarChats]);

  const loadArchivedChats = useCallback(async () => {
    if (!api) return;
    try {
      const data = await trainerApi.chat.getArchivedChats(api);
      const { privateChats: pChats, communityChats: cChats } = flattenSidebarChats(data);
      setArchivedChats([
        ...pChats.map((c: any) => ({ ...c, _archived: true })),
        ...cChats.map((c: any) => ({ ...c, _archived: true })),
      ]);
    } catch {
      setArchivedChats([]);
    }
  }, [api, flattenSidebarChats]);

  useEffect(() => {
    if (showArchived && archivedChats.length === 0) loadArchivedChats();
  }, [showArchived, archivedChats.length, loadArchivedChats]);

  /* ── WebSocket real-time integration ───────────────────────────── */

  // Join community/private rooms via WebSocket when chat is selected
  useEffect(() => {
    if (!socket || !selectedChat) return;
    const chatType = selectedChat.type || "community";
    if (chatType === "community") {
      socket.joinCommunity(selectedChat.id);
    } else {
      const otherUserId = selectedChat.other_user_id || selectedChat.partner_id || selectedChat.id;
      socket.joinPrivateChat(otherUserId);
    }
  }, [socket, selectedChat]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    // Private chat messages
    const unsubPrivate = socket.on("private_chat", (data: any) => {
      if (!data) return;
      switch (data.type) {
        case "new_message": {
          // Add to local messages if it's from the current chat
          const chatType = selectedChat?.type || "community";
          if (chatType === "private") {
            const serverMsg = {
              id: data.message_id || data.id,
              content: data.content,
              text: data.content,
              message_type: data.message_type || "text",
              sender: { id: data.sender_id, name: data.sender_name, profile_photo: data.sender_profile_photo },
              created_at: data.created_at || new Date().toISOString(),
              is_own_message: String(data.sender_id) === String(profile?.id),
              is_read: false,
              is_delivered: true,
              delivery_status: "delivered",
              reply_to: data.reply_to || null,
              thread_reply_count: data.thread_reply_count || 0,
              thread_root_id: data.thread_root_id || null,
            };

            // Write to privateMessagesMap (not localMessages)
            if (selectedChat) {
              const pmKey = String(selectedChat.id);
              setPrivateMessagesMap((prev) => {
              const existing = prev[pmKey] || [];
              // Deduplicate
              if (existing.some((m: any) => String(m.id) === String(serverMsg.id))) return prev;

              // Check if server echo of optimistic message
              const isSelfSender = String(data.sender_id) === String(profile?.id);
              if (isSelfSender) {
                const optimisticIdx = existing.findIndex(
                  (m: any) => String(m.id).startsWith("optimistic_") && m.content === data.content
                );
                if (optimisticIdx !== -1) {
                  // Replace optimistic with server-confirmed message
                  const updated = [...existing];
                  updated[optimisticIdx] = serverMsg;
                  return { ...prev, [pmKey]: updated };
                }
                // Own echo but no optimistic found — skip to avoid duplicate
                // (optimistic was already replaced or message was sent via REST)
                return prev;
              }

              return { ...prev, [pmKey]: [...existing, serverMsg] };
            });
            }
          }
          break;
        }
        case "typing": {
          if (data.is_typing && data.user_id) {
            const name = data.user_name || data.username || "Someone";
            setTypingUsers((prev) => prev.includes(name) ? prev : [...prev, name]);
            // Auto-clear after 4s
            setTimeout(() => setTypingUsers((prev) => prev.filter((n) => n !== name)), 4000);
          } else {
            const name = data.user_name || data.username;
            if (name) setTypingUsers((prev) => prev.filter((n) => n !== name));
          }
          break;
        }
        case "delivery_status": {
          const newStatus = data.status || "delivered";
          if (selectedChat) {
            const k = String(selectedChat.id);
            setPrivateMessagesMap((prev) => ({
              ...prev,
              [k]: (prev[k] || []).map((m: any) =>
                String(m.id) === String(data.message_id)
                  ? { ...m, is_delivered: newStatus === "delivered" || newStatus === "read", is_read: newStatus === "read", delivery_status: newStatus }
                  : m
              ),
            }));
          }
          break;
        }
        case "delivery_status_bulk": {
          const ids = new Set((data.message_ids || []).map(String));
          const newStatus = data.status || "delivered";
          if (selectedChat) {
            const k = String(selectedChat.id);
            setPrivateMessagesMap((prev) => ({
              ...prev,
              [k]: (prev[k] || []).map((m: any) =>
                ids.has(String(m.id))
                  ? { ...m, is_delivered: true, is_read: newStatus === "read", delivery_status: newStatus }
                  : m
              ),
            }));
          }
          break;
        }
        case "message_edited": {
          if (selectedChat) {
            const k = String(selectedChat.id);
            setPrivateMessagesMap((prev) => ({
              ...prev,
              [k]: (prev[k] || []).map((m: any) =>
                String(m.id) === String(data.message_id) ? { ...m, content: data.content, text: data.content, is_edited: true } : m
              ),
            }));
          }
          break;
        }
        case "message_deleted": {
          if (selectedChat) {
            const k = String(selectedChat.id);
            setPrivateMessagesMap((prev) => ({
              ...prev,
              [k]: (prev[k] || []).map((m: any) =>
                String(m.id) === String(data.message_id) ? { ...m, is_deleted: true, content: "", text: "" } : m
              ),
            }));
          }
          break;
        }
        case "online_status": {
          // Update presence cache for the user
          if (data.user_id) {
            setPresenceCache((prev) => ({
              ...prev,
              [data.user_id]: { is_online: data.is_online, last_seen: data.last_seen },
            }));
          }
          break;
        }
      }
    });

    // Community chat messages
    const unsubCommunity = socket.on("community_chat", (data: any) => {
      if (!data) return;
      switch (data.type) {
        case "new_message": {
          const chatType = selectedChat?.type || "community";
          if (chatType === "community") {
            const serverMsg = {
              id: data.message_id || data.id,
              content: data.content,
              text: data.content,
              message_type: data.message_type || "text",
              sender: { id: data.sender_id, name: data.sender_name, profile_photo: data.sender_profile_photo },
              created_at: data.created_at || new Date().toISOString(),
              is_own_message: String(data.sender_id) === String(profile?.id),
              reply_to: data.reply_to || null,
              thread_reply_count: data.thread_reply_count || 0,
              thread_root_id: data.thread_root_id || null,
            };

            setLocalMessages((prev) => {
              // Deduplicate by message_id
              if (prev.some((m) => String(m.id) === String(serverMsg.id))) return prev;

              // Check for optimistic message echo
              const isSelfSender = String(data.sender_id) === String(profile?.id);
              if (isSelfSender) {
                const optimisticIdx = prev.findIndex(
                  (m) => String(m.id).startsWith("optimistic_") && m.content === data.content
                );
                if (optimisticIdx !== -1) {
                  const updated = [...prev];
                  updated[optimisticIdx] = serverMsg;
                  return updated;
                }
              }

              return [...prev, serverMsg];
            });
          }
          break;
        }
        case "typing": {
          if (data.is_typing && data.user_id) {
            const name = data.user_name || data.username || "Someone";
            setTypingUsers((prev) => prev.includes(name) ? prev : [...prev, name]);
            setTimeout(() => setTypingUsers((prev) => prev.filter((n) => n !== name)), 4000);
          }
          break;
        }
        case "message_edited": {
          setLocalMessages((prev) => prev.map((m) =>
            String(m.id) === String(data.message_id) ? { ...m, content: data.content, text: data.content, is_edited: true } : m
          ));
          break;
        }
        case "message_deleted": {
          setLocalMessages((prev) => prev.map((m) =>
            String(m.id) === String(data.message_id) ? { ...m, is_deleted: true } : m
          ));
          break;
        }
        case "error": {
          if (data.moderation_action === "mute") {
            showToast?.("You have been muted in this community", "error");
          } else if (data.moderation_action === "ban") {
            showToast?.("You have been banned from this community", "error");
          } else if (data.moderation_action === "warning") {
            showToast?.(data.error || "Content warning", "error");
          } else if (data.code === "rate_limited") {
            showToast?.(`Rate limited. Try again in ${data.retry_after || 30} seconds`, "error");
          } else {
            showToast?.(data.error || data.message || "An error occurred", "error");
          }
          break;
        }
      }
    });

    return () => { unsubPrivate(); unsubCommunity(); };
  }, [socket, selectedChat, profile, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  // Send typing indicator via WebSocket (debounced)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendTypingIndicator = useCallback(() => {
    if (!socket || !selectedChat) return;
    const chatType = selectedChat.type || "community";
    if (chatType === "private") {
      const otherUserId = selectedChat.other_user_id || selectedChat.partner_id || selectedChat.id;
      socket.sendTyping(otherUserId);
    }
    // Auto-stop typing after 3s
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (socket && selectedChat && (selectedChat.type || "community") === "private") {
        const otherUserId = selectedChat.other_user_id || selectedChat.partner_id || selectedChat.id;
        socket.sendStopTyping(otherUserId);
      }
    }, 3000);
  }, [socket, selectedChat]);

  // Mark messages as read via WebSocket
  const markMessageReadViaSocket = useCallback((messageId: string) => {
    if (!socket || !selectedChat) return;
    const chatType = selectedChat.type || "community";
    if (chatType === "private") {
      const otherUserId = selectedChat.other_user_id || selectedChat.partner_id || selectedChat.id;
      socket.markRead(messageId, otherUserId);
    }
  }, [socket, selectedChat]);

  // WebRTC call handlers
  const handleStartVoiceCall = useCallback((userId: string, userName: string) => {
    if (!webrtc) { showToast?.("Call feature not available", "error"); return; }
    webrtc.startCall(userId, userName, "voice", api);
  }, [webrtc, api, showToast]);

  const handleStartVideoCall = useCallback((userId: string, userName: string) => {
    if (!webrtc) { showToast?.("Call feature not available", "error"); return; }
    webrtc.startCall(userId, userName, "video", api);
  }, [webrtc, api, showToast]);

  /* ── Load private messages when a private chat is selected ──────── */
  const lastLoadedChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!api || !selectedChat || currentChatType !== "private") return;
    const chatId = String(selectedChat.id);
    // Prevent re-fetching if same chat already loaded
    if (lastLoadedChatIdRef.current === chatId) return;
    lastLoadedChatIdRef.current = chatId;

    const loadPrivateMessages = async () => {
      try {
        const data = await trainerApi.chat.privateMessages(api, chatId);
        const raw = data?.results || data?.data?.results || data || [];
        const msgs = Array.isArray(raw) ? raw : [];
        setPrivateMessagesMap((prev) => ({
          ...prev,
          [chatId]: msgs,
        }));
        // Scroll to bottom after messages load
        setTimeout(() => scrollToBottom(), 100);
      } catch {
        showToast?.("Failed to load messages", "error");
      }
    };
    loadPrivateMessages();
  }, [api, selectedChat?.id, currentChatType, showToast]);

  /* ── Sync chatMessages prop to localMessages (community only) ──── */
  useEffect(() => {
    // Only sync for community chats — private messages are loaded separately
    if (currentChatType === "community") {
      setLocalMessages(chatMessages || []);
    }
  }, [chatMessages, currentChatType]);

  /* ── Auto scroll to bottom on new messages ──────────────────────── */
  useEffect(() => {
    scrollToBottom();
  }, [displayMessages.length]);

  /* ── Handle textarea auto-resize ────────────────────────────────── */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [messageInput, internalMsgInput, editText]);

  /* ── Scroll detection for "scroll to bottom" button ─────────────── */
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollBtn(distFromBottom > 200);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [selectedChat]);

  /* ── Debounced search ───────────────────────────────────────────── */
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setLocalSearch(chatSearch);
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [chatSearch]);

  /* ── Fetch presence for private chats ───────────────────────────── */
  useEffect(() => {
    if (!api || activePrivateChats.length === 0) return;
    const fetchPresence = async () => {
      const results: Record<string, any> = {};
      for (const chat of activePrivateChats) {
        const userId = (chat as any).other_user_uuid || (chat as any).user?.user_id || (chat as any).other_user?.user_id;
        if (!userId) continue;
        try {
          const p = await trainerApi.chat.getPresence(api, userId);
          results[userId] = p;
        } catch {
          // silent
        }
      }
      setPresenceCache(results);
    };
    fetchPresence();
    // Refresh presence every 60 seconds
    const interval = setInterval(fetchPresence, 60000);
    return () => clearInterval(interval);
  }, [api, activePrivateChats.length]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Helpers ────────────────────────────────────────────────────── */

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function getActiveInput(): string {
    if (editingMessage) return editText;
    return messageInput;
  }

  const handleInputChange = useCallback(
    (value: string) => {
      if (editingMessage) {
        setEditText(value);
      } else {
        onMessageInputChange(value);
        // Send typing indicator via WebSocket
        if (value.length > 0) sendTypingIndicator();
      }
    },
    [editingMessage, onMessageInputChange, sendTypingIndicator]
  );

  /* ── Chat selection ─────────────────────────────────────────────── */

  // Helper: add message to the correct store (private vs community)
  const addMessageToStore = useCallback((msg: any) => {
    if (currentChatType === "private" && selectedChat) {
      const key = String(selectedChat.id);
      setPrivateMessagesMap((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), msg],
      }));
    }
    // Community messages are managed by parent via chatMessages prop
    // Optimistic community messages still use localMessages for immediate feedback
    // but displayMessages only reads chatMessages for community
  }, [currentChatType, selectedChat]);

  // Helper: update a message in the correct store
  const updateMessageInStore = useCallback((msgId: string, updater: (m: any) => any) => {
    if (currentChatType === "private" && selectedChat) {
      const key = String(selectedChat.id);
      setPrivateMessagesMap((prev) => ({
        ...prev,
        [key]: (prev[key] || []).map((m) => String(m.id) === msgId ? updater(m) : m),
      }));
    }
  }, [currentChatType, selectedChat]);

  const handleSelectChat = useCallback(
    (chat: any) => {
      // Clear states
      setReplyingTo(null);
      setEditingMessage(null);
      setEditText("");
      setShowEmojiFor(null);
      setDeletingId(null);
      setShowMoreMenu(false);
      setShowPinnedPanel(false);
      setShowMembersPanel(false);
      setTypingUsers([]);
      setLocalMessages([]);

      // Reset load guard so new chat fetches messages
      lastLoadedChatIdRef.current = null;

      // Set the chat type
      setChatType(chat.type || "community");

      // Call parent
      onSelectChat(chat);
    },
    [onSelectChat]
  );

  /* ── Go back to chat list (mobile) ──────────────────────────────── */

  const handleBack = useCallback(() => {
    onSelectChat(null);
    setReplyingTo(null);
    setEditingMessage(null);
    setEditText("");
    setShowEmojiFor(null);
    setDeletingId(null);
    setShowMoreMenu(false);
    setShowPinnedPanel(false);
    setShowMembersPanel(false);
  }, [onSelectChat]);

  /* ── Send / Edit message ────────────────────────────────────────── */

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Edit mode
      if (editingMessage && api) {
        const newContent = editText.trim();
        if (!newContent) return;
        try {
          if (currentChatType === "community" && selectedChat) {
            await trainerApi.chat.editCommunityMessage(
              api,
              selectedChat.id,
              String(editingMessage.id),
              newContent
            );
          } else if (currentChatType === "private") {
            await trainerApi.chat.editPrivateMessage(
              api,
              String(editingMessage.id),
              newContent
            );
          }
          // Update local messages optimistically
          setLocalMessages((prev) =>
            prev.map((m) =>
              m.id === editingMessage.id
                ? { ...m, content: newContent, text: newContent, is_edited: true, edited: true }
                : m
            )
          );
          if (currentChatType === "private" && selectedChat) {
            setPrivateMessagesMap((prev) => {
              const key = String(selectedChat.id);
              const msgs = prev[key] || [];
              return {
                ...prev,
                [key]: msgs.map((m: any) =>
                  m.id === editingMessage.id
                    ? { ...m, content: newContent, text: newContent, is_edited: true, edited: true }
                    : m
                ),
              };
            });
          }
          showToast?.("Message edited", "success");
        } catch (err: any) {
          showToast?.(
            err instanceof Error ? err.message : "Failed to edit message",
            "error"
          );
        }
        setEditingMessage(null);
        setEditText("");
        onMessageInputChange("");
        return;
      }

      // Reply mode with WebSocket
      if (replyingTo && selectedChat) {
        const content = messageInput.trim();
        if (!content) return;

        // Try WebSocket first for replies
        if (socket?.isConnected) {
          const optimisticMsg = {
            id: "optimistic_" + Date.now(),
            content,
            text: content,
            sender: { id: profile?.id, name: profile?.name || profile?.first_name },
            created_at: new Date().toISOString(),
            is_own_message: true,
            delivery_status: "sent",
            message_type: "text",
            reply_to: replyingTo,
          };
          addMessageToStore(optimisticMsg);

          if (currentChatType === "private") {
            const otherUserId = selectedChat.other_user_id || selectedChat.partner_id || selectedChat.id;
            socket.sendPrivateMessage(otherUserId, content, "text", String(replyingTo.id));
          } else {
            // Community reply via WS: reply_to_id not reliably supported by WS protocol,
            // send as plain message (reply context visible from optimistic msg above)
            socket.sendCommunityMessage(selectedChat.id, content);
          }
          onMessageInputChange("");
          setReplyingTo(null);
          return;
        }

        // Fallback to REST for replies
        if (api) {
          try {
            if (currentChatType === "community") {
              await trainerApi.chat.replyCommunityMessage(
                api,
                selectedChat.id,
                String(replyingTo.id),
                content
              );
            } else {
              await trainerApi.chat.replyToPrivateMessage(
                api,
                String(replyingTo.id),
                content
              );
            }
            onMessageInputChange("");
            setReplyingTo(null);
            await reloadMessages();
            showToast?.("Reply sent", "success");
          } catch (err: any) {
            showToast?.(
              err instanceof Error ? err.message : "Failed to send reply",
              "error"
            );
          }
        }
        return;
      }

      // Normal send - WebSocket first, REST fallback
      const text = messageInput.trim();
      if (!text || !selectedChat) {
        onSendMessage(e);
        return;
      }

      if (socket?.isConnected) {
        // Create optimistic message
        const optimisticMsg = {
          id: "optimistic_" + Date.now(),
          content: text,
          text,
          sender: { id: profile?.id, name: profile?.name || profile?.first_name },
          created_at: new Date().toISOString(),
          is_own_message: true,
          delivery_status: "sent",
          message_type: "text",
        };

        // Add to the correct store: privateMessagesMap for private, localMessages for community
        if (currentChatType === "private") {
          addMessageToStore(optimisticMsg);
        } else {
          setLocalMessages((prev) => [...prev, optimisticMsg]);
        }

        // Send via WebSocket
        if (currentChatType === "private") {
          const otherUserId = selectedChat.other_user_id || selectedChat.partner_id || selectedChat.id;
          socket.sendPrivateMessage(otherUserId, text);
        } else {
          socket.sendCommunityMessage(selectedChat.id, text);
        }
        onMessageInputChange("");
      } else {
        // Fallback to REST via parent handler
        onSendMessage(e);
      }
    },
    [
      editingMessage,
      editText,
      replyingTo,
      api,
      selectedChat,
      currentChatType,
      messageInput,
      onSendMessage,
      onMessageInputChange,
      showToast,
      socket,
      profile,
      addMessageToStore,
    ]
  ); // eslint-disable-line react-hooks/exhaustive-deps -- reloadMessages defined after, captured by closure

  /* ── Reload messages after actions ──────────────────────────────── */

  const [needsJoin, setNeedsJoin] = useState(false);
  const [joining, setJoining] = useState(false);

  const reloadMessages = useCallback(async () => {
    if (!api || !selectedChat) return;
    setNeedsJoin(false);
    try {
      if (currentChatType === "community") {
        const data = await trainerApi.chat.communityMessages(api, selectedChat.id);
        const msgs = data?.results || data || [];
        setLocalMessages(msgs);
      } else {
        const data = await trainerApi.chat.privateMessages(api, selectedChat.id);
        const raw = data?.results || data?.data?.results || data || [];
        const msgs = Array.isArray(raw) ? raw : [];
        setPrivateMessagesMap((prev) => ({
          ...prev,
          [String(selectedChat.id)]: msgs,
        }));
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403 && currentChatType === "community") {
        setNeedsJoin(true);
      }
    }
  }, [api, selectedChat, currentChatType]);

  const handleJoinCommunity = useCallback(async () => {
    if (!api || !selectedChat) return;
    setJoining(true);
    try {
      await api.post(`/chat/communities/${selectedChat.id}/join/`);
      setNeedsJoin(false);
      showToast?.("Joined community!", "success");
      await reloadMessages();
    } catch (err: any) {
      showToast?.(err?.response?.data?.message || "Failed to join community", "error");
    } finally {
      setJoining(false);
    }
  }, [api, selectedChat, showToast, reloadMessages]);

  /* ── Message actions ────────────────────────────────────────────── */

  const handleReply = useCallback((msg: any) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    setEditText("");
    setShowEmojiFor(null);
    setDeletingId(null);
    textareaRef.current?.focus();
  }, []);

  const handleStartEdit = useCallback((msg: any) => {
    setEditingMessage(msg);
    setEditText(msg.content || msg.text || "");
    setReplyingTo(null);
    setShowEmojiFor(null);
    setDeletingId(null);
    textareaRef.current?.focus();
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setEditText("");
    onMessageInputChange("");
  }, [onMessageInputChange]);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleDeleteConfirm = useCallback((msgId: string) => {
    setDeletingId(msgId);
    setShowEmojiFor(null);
  }, []);

  const handleDeleteForMe = useCallback(
    async (msgId: string) => {
      if (!api) return;
      try {
        if (currentChatType === "community" && selectedChat) {
          await trainerApi.chat.deleteCommunityMessage(
            api,
            selectedChat.id,
            msgId
          );
        } else {
          await trainerApi.chat.deletePrivateMessage(api, msgId, "for_me");
        }
        // Remove from local
        setLocalMessages((prev) => prev.filter((m) => String(m.id) !== msgId));
        if (currentChatType === "private" && selectedChat) {
          setPrivateMessagesMap((prev) => {
            const key = String(selectedChat.id);
            return {
              ...prev,
              [key]: (prev[key] || []).filter((m: any) => String(m.id) !== msgId),
            };
          });
        }
        showToast?.("Message deleted", "success");

        // Set lastDeleted for undo functionality (10s window)
        if (lastDeletedTimerRef.current) clearTimeout(lastDeletedTimerRef.current);
        setLastDeleted({
          id: msgId,
          type: currentChatType,
          chatId: selectedChat?.id || "",
          expiresAt: Date.now() + 10000,
        });
        lastDeletedTimerRef.current = setTimeout(() => {
          setLastDeleted(null);
        }, 10000);
      } catch (err: any) {
        showToast?.(
          err instanceof Error ? err.message : "Failed to delete message",
          "error"
        );
      }
      setDeletingId(null);
    },
    [api, currentChatType, selectedChat, showToast]
  );

  const handleDeleteForEveryone = useCallback(
    async (msgId: string) => {
      if (!api) return;
      try {
        if (currentChatType === "community" && selectedChat) {
          await trainerApi.chat.deleteCommunityMessage(
            api,
            selectedChat.id,
            msgId
          );
        } else {
          await trainerApi.chat.deletePrivateMessage(api, msgId, "for_everyone");
        }
        // Mark as deleted in local state
        setLocalMessages((prev) =>
          prev.map((m) =>
            String(m.id) === msgId ? { ...m, is_deleted: true, deleted: true } : m
          )
        );
        if (currentChatType === "private" && selectedChat) {
          setPrivateMessagesMap((prev) => {
            const key = String(selectedChat.id);
            return {
              ...prev,
              [key]: (prev[key] || []).map((m: any) =>
                String(m.id) === msgId ? { ...m, is_deleted: true, deleted: true } : m
              ),
            };
          });
        }
        showToast?.("Message deleted for everyone", "success");

        // Set lastDeleted for undo functionality (10s window)
        if (lastDeletedTimerRef.current) clearTimeout(lastDeletedTimerRef.current);
        setLastDeleted({
          id: msgId,
          type: currentChatType,
          chatId: selectedChat?.id || "",
          expiresAt: Date.now() + 10000,
        });
        lastDeletedTimerRef.current = setTimeout(() => {
          setLastDeleted(null);
        }, 10000);
      } catch (err: any) {
        showToast?.(
          err instanceof Error ? err.message : "Failed to delete message",
          "error"
        );
      }
      setDeletingId(null);
    },
    [api, currentChatType, selectedChat, showToast]
  );

  const handleRestoreMessage = useCallback(async () => {
    if (!api || !lastDeleted) return;
    try {
      if (lastDeleted.type === "private") {
        await api.post(`/chat/private-messages/${lastDeleted.id}/restore/`);
      } else {
        await api.post(`/chat/community-messages/${lastDeleted.id}/restore/`);
      }
      showToast?.("Message restored", "success");
      setLastDeleted(null);
      if (lastDeletedTimerRef.current) clearTimeout(lastDeletedTimerRef.current);
      await reloadMessages();
    } catch (err: any) {
      showToast?.(
        err instanceof Error ? err.message : "Failed to restore message",
        "error"
      );
    }
  }, [api, lastDeleted, showToast, reloadMessages]);

  const handlePin = useCallback(
    async (msgId: string) => {
      if (!api) return;
      try {
        if (currentChatType === "community" && selectedChat) {
          await trainerApi.chat.pinCommunityMessage(
            api,
            selectedChat.id,
            msgId
          );
        } else {
          await trainerApi.chat.pinPrivateMessage(api, msgId);
        }
        showToast?.("Message pinned", "success");
        await reloadMessages();
      } catch (err: any) {
        showToast?.(
          err instanceof Error ? err.message : "Failed to pin message",
          "error"
        );
      }
    },
    [api, currentChatType, selectedChat, showToast, reloadMessages]
  );

  const handleStar = useCallback(
    async (msgId: string) => {
      if (!api) return;
      try {
        if (currentChatType === "community" && selectedChat) {
          await trainerApi.chat.starCommunityMessage(
            api,
            selectedChat.id,
            msgId
          );
        } else {
          await trainerApi.chat.starPrivateMessage(api, msgId);
        }
        showToast?.("Message starred", "success");
        await reloadMessages();
      } catch (err: any) {
        showToast?.(
          err instanceof Error ? err.message : "Failed to star message",
          "error"
        );
      }
    },
    [api, currentChatType, selectedChat, showToast, reloadMessages]
  );

  const handleCopyText = useCallback(
    (msg: any) => {
      const text = msg.content || msg.text || "";
      navigator.clipboard.writeText(text).then(
        () => showToast?.("Copied to clipboard", "success"),
        () => showToast?.("Failed to copy", "error")
      );
    },
    [showToast]
  );

  const handleReact = useCallback(
    async (msgId: string, emoji: string) => {
      if (!api) return;
      try {
        if (currentChatType === "community" && selectedChat) {
          await trainerApi.chat.reactToCommunityMessage(
            api,
            selectedChat.id,
            msgId,
            emoji
          );
        } else {
          await trainerApi.chat.reactToPrivateMessage(api, msgId, emoji);
        }
        setShowEmojiFor(null);
        await reloadMessages();
      } catch (err: any) {
        showToast?.(
          err instanceof Error ? err.message : "Failed to add reaction",
          "error"
        );
      }
    },
    [api, currentChatType, selectedChat, showToast, reloadMessages]
  );

  /* ── Header actions ─────────────────────────────────────────────── */

  const handleCall = useCallback(
    (type: "voice" | "video") => {
      if (!selectedChat) return;
      const chatType = selectedChat.type || "community";
      if (chatType !== "private") {
        showToast?.("Calls are only available in private chats", "error");
        return;
      }
      const userId = String(selectedChat.other_user_id || selectedChat.partner_id || selectedChat.id);
      const userName = getChatName(selectedChat);
      if (type === "voice") {
        handleStartVoiceCall(userId, userName);
      } else {
        handleStartVideoCall(userId, userName);
      }
    },
    [selectedChat, handleStartVoiceCall, handleStartVideoCall, showToast]
  );

  const handleMute = useCallback(async () => {
    if (!api || !selectedChat) return;
    try {
      if (currentChatType === "private") {
        await trainerApi.chat.muteRoom(api, selectedChat.id);
        showToast?.("Chat muted", "success");
      } else {
        showToast?.("Mute is only available for private chats", "error");
      }
    } catch (err: any) {
      showToast?.(
        err instanceof Error ? err.message : "Failed to mute",
        "error"
      );
    }
  }, [api, selectedChat, currentChatType, showToast]);

  const handleArchive = useCallback(async () => {
    if (!api || !selectedChat) return;
    const isArchived = selectedChat._archived || selectedChat.is_archived;
    try {
      if (currentChatType === "private") {
        if (isArchived) {
          // Unarchive
          await api.post(`/chat/private-chat/${selectedChat.id}/archive/`, { action: "unarchive" });
          showToast?.("Chat unarchived", "success");
          // Move back to private chats and remove from archived
          setArchivedChats((prev) => prev.filter((c) => c.id !== selectedChat.id));
          setPrivateChats((prev) => [...prev, { ...selectedChat, _archived: false, is_archived: false, status: "active" }]);
        } else {
          await trainerApi.chat.archiveRoom(api, selectedChat.id);
          showToast?.("Chat archived", "success");
          // Remove from private chats list
          setPrivateChats((prev) => prev.filter((c) => c.id !== selectedChat.id));
        }
        onSelectChat(null);
      } else {
        if (isArchived) {
          try {
            await api.post(`/chat/communities/${selectedChat.id}/archive/`, { action: "unarchive" });
            showToast?.("Community unarchived", "success");
            setArchivedChats((prev) => prev.filter((c) => c.id !== selectedChat.id));
          } catch (err: any) {
            showToast?.(err?.response?.data?.message || "Failed to unarchive community", "error");
          }
        } else {
          try {
            await api.post(`/chat/communities/${selectedChat.id}/archive/`);
            showToast?.("Community archived", "success");
          } catch (err: any) {
            showToast?.(err?.response?.data?.message || "Failed to archive community", "error");
          }
        }
      }
    } catch (err: any) {
      showToast?.(
        err instanceof Error ? err.message : isArchived ? "Failed to unarchive" : "Failed to archive",
        "error"
      );
    }
  }, [api, selectedChat, currentChatType, showToast, onSelectChat]);

  const handleShowPinned = useCallback(async () => {
    if (!api || !selectedChat) return;
    try {
      let data;
      if (currentChatType === "community") {
        data = await trainerApi.chat.getPinnedCommunityMessages(
          api,
          selectedChat.id
        );
      } else {
        data = await trainerApi.chat.getPinnedPrivateMessages(
          api,
          selectedChat.id
        );
      }
      setPinnedMessages(data?.results || data || []);
      setShowPinnedPanel(true);
    } catch (err: any) {
      showToast?.(
        err instanceof Error ? err.message : "Failed to load pinned messages",
        "error"
      );
    }
  }, [api, selectedChat, currentChatType, showToast]);

  const handleShowMembers = useCallback(async () => {
    if (!api || !selectedChat || currentChatType !== "community") return;
    try {
      const data = await trainerApi.chat.getCommunityMembers(
        api,
        selectedChat.id
      );
      setCommunityMembers(data?.results || data?.members || data || []);
      setShowMembersPanel(true);
    } catch (err: any) {
      showToast?.(
        err instanceof Error ? err.message : "Failed to load members",
        "error"
      );
    }
  }, [api, selectedChat, currentChatType, showToast]);

  const handleClearChat = useCallback(async () => {
    if (!api || !selectedChat) return;
    try {
      if (currentChatType === "private") {
        await trainerApi.chat.clearRoom(api, selectedChat.id);
        setLocalMessages([]);
        setPrivateMessagesMap((prev) => ({
          ...prev,
          [String(selectedChat.id)]: [],
        }));
        showToast?.("Chat cleared", "success");
      } else {
        try {
          await api.post(`/chat/communities/${selectedChat.id}/clear/`);
          showToast?.("Chat cleared", "success");
          setLocalMessages([]);
        } catch (err: any) {
          showToast?.(err?.response?.data?.message || "Failed to clear chat", "error");
        }
      }
    } catch (err: any) {
      showToast?.(
        err instanceof Error ? err.message : "Failed to clear chat",
        "error"
      );
    }
  }, [api, selectedChat, currentChatType, showToast]);

  const handleBlock = useCallback(async () => {
    if (!api || !selectedChat || currentChatType !== "private") return;
    try {
      await trainerApi.chat.blockUser(api, selectedChat.id);
      showToast?.("User blocked", "success");
      setPrivateChats((prev) => prev.filter((c) => c.id !== selectedChat.id));
      onSelectChat(null);
    } catch (err: any) {
      showToast?.(
        err instanceof Error ? err.message : "Failed to block user",
        "error"
      );
    }
  }, [api, selectedChat, currentChatType, showToast, onSelectChat]);

  /* ── Accept / Reject private chat requests ──────────────────────── */

  const handleAcceptRequest = useCallback(
    async (roomId: string | number) => {
      if (!api) return;
      try {
        await trainerApi.chat.acceptRoom(api, roomId);
        showToast?.("Chat request accepted", "success");
        // Move from pending to active
        setPrivateChats((prev) =>
          prev.map((c) =>
            c.id === roomId ? { ...c, status: "active" } : c
          )
        );
      } catch (err: any) {
        showToast?.(
          err instanceof Error ? err.message : "Failed to accept",
          "error"
        );
      }
    },
    [api, showToast]
  );

  const handleRejectRequest = useCallback(
    async (roomId: string | number) => {
      if (!api) return;
      try {
        await trainerApi.chat.rejectRoom(api, roomId);
        showToast?.("Chat request rejected", "success");
        setPrivateChats((prev) => prev.filter((c) => c.id !== roomId));
      } catch (err: any) {
        showToast?.(
          err instanceof Error ? err.message : "Failed to reject",
          "error"
        );
      }
    },
    [api, showToast]
  );

  /* ── Load older messages on scroll to top ───────────────────────── */

  const handleScrollTop = useCallback(async () => {
    const container = messagesContainerRef.current;
    if (!container || loadingMore || !api || !selectedChat) return;
    if (container.scrollTop > 50) return; // Only when near top

    setLoadingMore(true);
    const prevScrollHeight = container.scrollHeight;
    try {
      const oldestMsg = displayMessages[0];
      const cursor = oldestMsg?.id ? String(oldestMsg.id) : undefined;
      if (!cursor) {
        setLoadingMore(false);
        return;
      }

      let data;
      if (currentChatType === "community") {
        data = await trainerApi.chat.communityMessages(api, selectedChat.id, {
          before: cursor,
        });
      } else {
        data = await trainerApi.chat.privateMessages(api, selectedChat.id, {
          before: cursor,
        });
      }

      const olderMsgs = data?.results || data || [];
      if (olderMsgs.length === 0) {
        setLoadingMore(false);
        return;
      }

      const updateMsgs = (prev: any[]) => [...olderMsgs, ...prev];
      setLocalMessages(updateMsgs);
      if (currentChatType === "private") {
        setPrivateMessagesMap((prev) => ({
          ...prev,
          [String(selectedChat.id)]: updateMsgs(prev[String(selectedChat.id)] || []),
        }));
      }

      // Maintain scroll position
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } catch {
      showToast?.("Failed to load older messages", "error");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, api, selectedChat, currentChatType, displayMessages, showToast]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScrollTop);
    return () => container.removeEventListener("scroll", handleScrollTop);
  }, [handleScrollTop]);

  /* ── Mark messages as read when private chat is viewed ──────────── */

  useEffect(() => {
    if (!selectedChat || currentChatType !== "private") return;

    // Find the latest message from the other user
    const otherUserMsgs = displayMessages.filter(
      (m) => !isOwnMessage(m, profile) && m.id && !String(m.id).startsWith("optimistic_")
    );
    if (otherUserMsgs.length === 0) return;

    const latestOtherMsg = otherUserMsgs[otherUserMsgs.length - 1];
    const otherUserId = selectedChat.other_user_id || selectedChat.partner_id || selectedChat.id;

    // Prefer WebSocket for marking read
    if (socket?.isConnected && latestOtherMsg.id) {
      socket.markRead(String(latestOtherMsg.id), otherUserId);
      return;
    }

    // Fallback to REST
    if (!api) return;
    const markRead = async () => {
      for (const msg of otherUserMsgs) {
        if (msg.status !== "read" && msg.delivery_status !== "read") {
          try {
            await trainerApi.chat.markMessageRead(api, String(msg.id));
          } catch {
            // silent
          }
        }
      }
    };
    markRead();
  }, [api, selectedChat, currentChatType, displayMessages, profile, socket]);

  /* ── Keyboard shortcuts ─────────────────────────────────────────── */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter (without Shift) sends message
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
      // Escape cancels edit/reply
      if (e.key === "Escape") {
        if (editingMessage) {
          handleCancelEdit();
        } else if (replyingTo) {
          handleCancelReply();
        }
      }
    },
    [handleSubmit, editingMessage, replyingTo, handleCancelEdit, handleCancelReply]
  );

  /* ── Attachment handler (placeholder) ───────────────────────────── */

  const handleAttachment = useCallback(() => {
    showToast?.("File attachments are available in the mobile app", "error");
  }, [showToast]);

  /* ── Get online status text ─────────────────────────────────────── */

  function getOnlineStatusText(): string {
    if (!selectedChat) return "";
    if (currentChatType === "community") {
      const count = selectedChat.members_count || selectedChat.active_members_count || selectedChat.member_count || 0;
      const joinedLabel = selectedChat.is_joined ? "" : " · Not joined";
      return count > 0 ? `${count} members${joinedLabel}` : `Community${joinedLabel}`;
    }
    const userId = (selectedChat as any).other_user_uuid || selectedChat.user?.user_id || selectedChat.other_user_id || selectedChat.other_user?.id || selectedChat.user?.id;
    if (userId && presenceCache[userId]) {
      const p = presenceCache[userId];
      if (p.is_online) return "Online";
      if (p.last_seen) {
        const ago = Date.now() - new Date(p.last_seen).getTime();
        if (ago < 3600000) return `Last seen ${Math.round(ago / 60000)}m ago`;
        if (ago < 86400000) return `Last seen ${Math.round(ago / 3600000)}h ago`;
        return `Last seen ${new Date(p.last_seen).toLocaleDateString()}`;
      }
    }
    if (selectedChat.other_user?.is_online || selectedChat.user?.is_online) return "Online";
    return "Offline";
  }

  const onlineStatusText = getOnlineStatusText();
  const isOnline =
    onlineStatusText === "Online" ||
    (selectedChat?.other_user?.is_online === true);

  /* ================================================================ */
  /*  RENDER                                                            */
  /* ================================================================ */

  return (
    <div
      className="flex h-[calc(100vh-130px)] md:h-[calc(100vh-140px)] rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${BRAND.border}`,
        backgroundColor: BRAND.bg,
      }}
    >
      {/* ============================================================ */}
      {/*  LEFT: Chat List Panel (280px)                                */}
      {/* ============================================================ */}
      <div
        className={`w-full md:w-[280px] lg:w-[300px] flex flex-col shrink-0 border-r ${
          selectedChat ? "hidden md:flex" : "flex"
        }`}
        style={{
          borderColor: BRAND.border,
          backgroundColor: BRAND.surface,
        }}
      >
        {/* Search bar */}
        <div
          className="p-3 border-b"
          style={{ borderColor: BRAND.border }}
        >
          <h2
            className="text-base font-bold mb-3"
            style={{ color: BRAND.textMain }}
          >
            Messages
          </h2>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: BRAND.textDim }}
            />
            <input
              type="text"
              placeholder="Search chats..."
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{
                backgroundColor: BRAND.input,
                color: BRAND.textMain,
                border: `1px solid ${BRAND.border}`,
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = BRAND.primary;
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = BRAND.border;
              }}
            />
            {chatSearch && (
              <button
                onClick={() => setChatSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: BRAND.textDim }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable chat list */}
        <div className="flex-1 overflow-y-auto">
          {loading && !communities.length ? (
            <div className="flex items-center justify-center py-12">
              <Loader2
                size={24}
                className="animate-spin"
                style={{ color: BRAND.primary }}
              />
            </div>
          ) : (
            <>
              {/* ── Communities Section ──────────────────────────── */}
              {filteredCommunities.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: BRAND.textDim }}
                    >
                      Communities
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: BRAND.panelLight,
                        color: BRAND.textMuted,
                      }}
                    >
                      {filteredCommunities.length}
                    </span>
                  </div>
                  <div className="px-1.5 space-y-0.5">
                    {filteredCommunities.map((chat) => (
                      <ChatListItemComponent
                        key={`c-${chat.id}`}
                        chat={chat}
                        isSelected={
                          selectedChat?.id === chat.id &&
                          currentChatType === "community"
                        }
                        onClick={() => handleSelectChat(chat)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Pending Chat Requests ───────────────────────── */}
              {filteredPendingChats.length > 0 && (
                <div className="pt-3">
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: BRAND.accent }}
                    >
                      Requests
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: BRAND.accent,
                        color: BRAND.bg,
                      }}
                    >
                      {filteredPendingChats.length}
                    </span>
                  </div>
                  <div className="px-1.5 space-y-1">
                    {filteredPendingChats.map((chat) => (
                      <PendingChatItem
                        key={`p-${chat.id}`}
                        chat={chat}
                        onAccept={() => handleAcceptRequest(chat.id)}
                        onReject={() => handleRejectRequest(chat.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Private Chats Section ───────────────────────── */}
              <div className="pt-3 pb-2">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: BRAND.textDim }}
                  >
                    Private Chats
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: BRAND.panelLight,
                      color: BRAND.textMuted,
                    }}
                  >
                    {loadingPrivateChats ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      filteredPrivateChats.length
                    )}
                  </span>
                </div>
                <div className="px-1.5 space-y-0.5">
                  {loadingPrivateChats ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2
                        size={18}
                        className="animate-spin"
                        style={{ color: BRAND.primary }}
                      />
                    </div>
                  ) : filteredPrivateChats.length === 0 ? (
                    <div className="px-3 py-4 text-center">
                      <Lock size={16} className="mx-auto mb-1" style={{ color: BRAND.textDim }} />
                      <p className="text-xs" style={{ color: BRAND.textDim }}>
                        No private chats yet
                      </p>
                    </div>
                  ) : (
                    filteredPrivateChats.map((chat) => (
                      <ChatListItemComponent
                        key={`d-${chat.id}`}
                        chat={chat}
                        isSelected={
                          selectedChat?.id === chat.id &&
                          currentChatType === "private"
                        }
                        onClick={() => handleSelectChat(chat)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* ── Archived Chats Section ────────────────────── */}
              <div className="pt-2 pb-2">
                <button
                  onClick={() => setShowArchived((v) => !v)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.textDim }}>
                    Archived
                  </span>
                  <ChevronDown
                    size={12}
                    style={{ color: BRAND.textDim, transform: showArchived ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                  />
                </button>
                {showArchived && (
                  <div className="mt-1 space-y-0.5">
                    {archivedChats.length === 0 ? (
                      <p className="text-xs text-center py-3" style={{ color: BRAND.textDim }}>No archived chats</p>
                    ) : (
                      archivedChats.map((chat) => (
                        <ChatListItemComponent
                          key={`archived-${chat.id}`}
                          chat={chat}
                          isSelected={selectedChat?.id === chat.id}
                          onClick={() => handleSelectChat(chat)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Show "no results" if search yields nothing */}
              {localSearch &&
                filteredCommunities.length === 0 &&
                filteredPrivateChats.length === 0 &&
                filteredPendingChats.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Search size={20} className="mx-auto mb-2" style={{ color: BRAND.textDim }} />
                    <p className="text-sm" style={{ color: BRAND.textDim }}>
                      No chats matching &quot;{localSearch}&quot;
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  RIGHT: Conversation Panel                                    */}
      {/* ============================================================ */}
      <div
        className={`flex-1 flex flex-col min-w-0 relative ${
          !selectedChat ? "hidden md:flex" : "flex"
        }`}
        style={{ backgroundColor: BRAND.bg }}
      >
        {!selectedChat ? (
          <EmptyConversation />
        ) : (
          <>
            {/* ── Chat Header ──────────────────────────────────── */}
            <div
              className="flex items-center justify-between px-3 md:px-4 h-14 shrink-0 border-b"
              style={{
                borderColor: BRAND.border,
                backgroundColor: BRAND.surface,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Back button (mobile) */}
                <button
                  onClick={handleBack}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
                  style={{ color: BRAND.textMuted }}
                >
                  <ChevronLeft size={20} />
                </button>

                <Avatar
                  name={getChatName(selectedChat)}
                  size={36}
                  isOnline={
                    currentChatType === "private" ? isOnline : undefined
                  }
                  imageUrl={
                    selectedChat.avatar ||
                    selectedChat.other_user?.profile_image ||
                    selectedChat.image
                  }
                />
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: BRAND.textMain }}
                  >
                    {getChatName(selectedChat)}
                  </p>
                  <p
                    className="text-[11px] truncate"
                    style={{
                      color: isOnline ? BRAND.success : BRAND.textDim,
                    }}
                  >
                    {onlineStatusText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Call buttons (private only) */}
                {currentChatType === "private" && (
                  <>
                    <button
                      onClick={() => handleCall("voice")}
                      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
                      style={{ color: BRAND.textMuted }}
                      title="Voice call"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={() => handleCall("video")}
                      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
                      style={{ color: BRAND.textMuted }}
                      title="Video call"
                    >
                      <Video size={16} />
                    </button>
                  </>
                )}

                {/* More menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
                    style={{ color: BRAND.textMuted }}
                    title="More options"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {showMoreMenu && (
                    <HeaderMoreMenu
                      chatType={currentChatType}
                      onMute={handleMute}
                      onArchive={handleArchive}
                      onPinned={handleShowPinned}
                      onMembers={handleShowMembers}
                      onClear={handleClearChat}
                      onBlock={handleBlock}
                      onClose={() => setShowMoreMenu(false)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ── Pinned Messages Panel (overlay) ──────────────── */}
            {showPinnedPanel && (
              <PinnedMessagesPanel
                messages={pinnedMessages}
                onClose={() => setShowPinnedPanel(false)}
              />
            )}

            {/* ── Members Panel (overlay) ──────────────────────── */}
            {showMembersPanel && (
              <MembersPanel
                members={communityMembers}
                onClose={() => setShowMembersPanel(false)}
              />
            )}

            {/* ── Message List ─────────────────────────────────── */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto relative"
              style={{ backgroundColor: BRAND.bg }}
            >
              {/* Loading more indicator */}
              {loadingMore && (
                <div className="flex items-center justify-center py-3">
                  <Loader2
                    size={18}
                    className="animate-spin"
                    style={{ color: BRAND.primary }}
                  />
                  <span
                    className="text-xs ml-2"
                    style={{ color: BRAND.textDim }}
                  >
                    Loading older messages...
                  </span>
                </div>
              )}

              {needsJoin ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: BRAND.surface }}>
                      <Users size={28} style={{ color: BRAND.textDim }} />
                    </div>
                    <p className="text-sm font-medium mb-1" style={{ color: BRAND.textMuted }}>
                      Join to see messages
                    </p>
                    <p className="text-xs mb-4" style={{ color: BRAND.textDim }}>
                      You need to be a member of this community to view and send messages.
                    </p>
                    <button
                      onClick={handleJoinCommunity}
                      disabled={joining}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})` }}
                    >
                      {joining ? "Joining..." : "Join Community"}
                    </button>
                  </div>
                </div>
              ) : displayMessages.length === 0 ? (
                <NoMessages chatName={getChatName(selectedChat)} />
              ) : (
                <div className="py-3 space-y-1">
                  {displayMessages.map((msg, idx) => {
                    const own = isOwnMessage(msg, profile);
                    const msgId = String(msg.id || idx);
                    const dateStr = msg.created_at || msg.timestamp;
                    const showDivider = shouldShowDateDivider(displayMessages, idx);

                    return (
                      <div key={msgId}>
                        {showDivider && dateStr && (
                          <DateDivider label={getDateDivider(dateStr)} />
                        )}
                        <MessageBubble
                          msg={msg}
                          isOwn={own}
                          profile={profile}
                          hoveredId={hoveredMsgId}
                          showEmojiFor={showEmojiFor}
                          deletingId={deletingId}
                          onHover={setHoveredMsgId}
                          onLeave={() => setHoveredMsgId(null)}
                          onReply={() => handleReply(msg)}
                          onEdit={() => handleStartEdit(msg)}
                          onDelete={() => handleDeleteConfirm(msgId)}
                          onPin={() => handlePin(msgId)}
                          onStar={() => handleStar(msgId)}
                          onCopy={() => handleCopyText(msg)}
                          onReact={(emoji) => handleReact(msgId, emoji)}
                          onToggleEmoji={() =>
                            setShowEmojiFor(
                              showEmojiFor === msgId ? null : msgId
                            )
                          }
                          onDeleteForMe={() => handleDeleteForMe(msgId)}
                          onDeleteForEveryone={() => handleDeleteForEveryone(msgId)}
                          onCancelDelete={() => setDeletingId(null)}
                        />
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Scroll to bottom button */}
              {showScrollBtn && (
                <ScrollToBottomButton onClick={scrollToBottom} />
              )}
            </div>

            {/* ── Typing indicator ─────────────────────────────── */}
            {typingUsers.length > 0 && (
              <div
                className="px-4 py-1.5 flex items-center gap-2"
                style={{ backgroundColor: BRAND.surface }}
              >
                <TypingDots />
                <span className="text-xs" style={{ color: BRAND.textDim }}>
                  {typingUsers.length === 1
                    ? `${typingUsers[0]} is typing...`
                    : `${typingUsers.length} people are typing...`}
                </span>
              </div>
            )}

            {/* ── Undo Delete Banner ────────────────────────────── */}
            {lastDeleted && (
              <div
                className="px-3 md:px-4 py-2 flex items-center justify-between border-t"
                style={{
                  borderColor: BRAND.border,
                  backgroundColor: BRAND.surface,
                }}
              >
                <div className="flex items-center gap-2">
                  <Trash2 size={14} style={{ color: BRAND.textMuted }} />
                  <span className="text-xs" style={{ color: BRAND.textMuted }}>
                    Message deleted
                  </span>
                </div>
                <button
                  onClick={handleRestoreMessage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: `${BRAND.primary}20`,
                    color: BRAND.primary,
                  }}
                >
                  <Undo2 size={12} />
                  Undo
                </button>
              </div>
            )}

            {/* ── Reply / Edit Bar ─────────────────────────────── */}
            {(replyingTo || editingMessage) && (
              <div
                className="px-3 md:px-4 py-2 flex items-start gap-3 border-t"
                style={{
                  borderColor: BRAND.border,
                  backgroundColor: BRAND.surface,
                }}
              >
                <div
                  className="flex-1 rounded-lg px-3 py-2 border-l-2"
                  style={{
                    backgroundColor: "rgba(126,34,206,0.08)",
                    borderLeftColor: editingMessage ? BRAND.info : BRAND.accent,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {editingMessage ? (
                      <Pencil size={12} style={{ color: BRAND.info }} />
                    ) : (
                      <Reply size={12} style={{ color: BRAND.accent }} />
                    )}
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: editingMessage ? BRAND.info : BRAND.accent,
                      }}
                    >
                      {editingMessage
                        ? "Editing message"
                        : `Replying to ${getSenderName(replyingTo)}`}
                    </span>
                  </div>
                  <p
                    className="text-xs truncate"
                    style={{ color: BRAND.textDim }}
                  >
                    {truncate(
                      (editingMessage || replyingTo)?.content ||
                        (editingMessage || replyingTo)?.text ||
                        "",
                      100
                    )}
                  </p>
                </div>
                <button
                  onClick={editingMessage ? handleCancelEdit : handleCancelReply}
                  className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 mt-1 transition-colors hover:opacity-80"
                  style={{ color: BRAND.textDim }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* ── Message Input ────────────────────────────────── */}
            <div
              className="px-3 md:px-4 py-2.5 border-t shrink-0"
              style={{
                borderColor: BRAND.border,
                backgroundColor: BRAND.surface,
              }}
            >
              <form
                onSubmit={handleSubmit}
                className="flex items-end gap-2"
              >
                {/* Attachment button */}
                <button
                  type="button"
                  onClick={handleAttachment}
                  className="w-9 h-9 flex items-center justify-center rounded-lg shrink-0 transition-colors hover:opacity-80 mb-0.5"
                  style={{
                    color: BRAND.textMuted,
                    backgroundColor: BRAND.panel,
                  }}
                  title="Attach file"
                >
                  <Paperclip size={16} />
                </button>

                {/* Textarea */}
                <div
                  className="flex-1 rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: BRAND.input,
                    border: `1px solid ${BRAND.border}`,
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    value={editingMessage ? editText : messageInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      editingMessage
                        ? "Edit your message..."
                        : replyingTo
                          ? "Type your reply..."
                          : "Type a message..."
                    }
                    rows={1}
                    className="w-full px-3 py-2 text-sm resize-none outline-none"
                    style={{
                      backgroundColor: "transparent",
                      color: BRAND.textMain,
                      maxHeight: 120,
                      minHeight: 36,
                    }}
                  />
                </div>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={
                    editingMessage
                      ? !editText.trim()
                      : !messageInput.trim()
                  }
                  className="w-9 h-9 flex items-center justify-center rounded-lg shrink-0 transition-all mb-0.5 hover:opacity-90 disabled:opacity-40"
                  style={{
                    backgroundColor: BRAND.primary,
                    color: "#fff",
                  }}
                  title={editingMessage ? "Save edit" : "Send message"}
                >
                  {editingMessage ? (
                    <Check size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>

              {/* Keyboard hint */}
              {editingMessage && (
                <p
                  className="text-[10px] mt-1 text-center"
                  style={{ color: BRAND.textDim }}
                >
                  Enter to save, Esc to cancel
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ══ WebRTC Call Overlay ══ */}
      {webrtc && webrtc.callState.status !== "idle" && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
          <div className="w-full max-w-md rounded-3xl p-8 text-center" style={{ backgroundColor: BRAND.panel }}>
            {webrtc.callState.status === "incoming_ringing" && (
              <>
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse"
                  style={{ background: `linear-gradient(135deg, ${BRAND.success}, #059669)` }}>
                  <Phone size={32} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{webrtc.callState.remoteUserName || "Incoming Call"}</h3>
                <p className="text-sm mb-6" style={{ color: BRAND.textMuted }}>
                  {webrtc.callState.callType === "video" ? "Video" : "Voice"} call...
                </p>
                <div className="flex justify-center gap-6">
                  <button onClick={() => webrtc.endCall()}
                    className="w-14 h-14 rounded-full flex items-center justify-center transition" style={{ backgroundColor: BRAND.error }}>
                    <PhoneOff size={24} className="text-white" />
                  </button>
                  <button onClick={() => webrtc.acceptCall(api)}
                    className="w-14 h-14 rounded-full flex items-center justify-center transition" style={{ backgroundColor: BRAND.success }}>
                    <Phone size={24} className="text-white" />
                  </button>
                </div>
              </>
            )}
            {(webrtc.callState.status === "outgoing_ringing" || webrtc.callState.status === "connecting" || webrtc.callState.status === "connected" || webrtc.callState.status === "reconnecting") && (
              <>
                {webrtc.callState.callType === "video" && (
                  <div className="relative mb-4 rounded-xl overflow-hidden aspect-video" style={{ backgroundColor: "#000" }}>
                    <video ref={webrtc.remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <video ref={webrtc.localVideoRef} autoPlay playsInline muted
                      className="absolute bottom-3 right-3 w-28 h-20 rounded-lg object-cover border-2 border-white/20" />
                  </div>
                )}
                {webrtc.callState.callType === "voice" && (
                  <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})` }}>
                    <span className="text-3xl font-bold text-white">
                      {(webrtc.callState.remoteUserName || "?")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{webrtc.callState.remoteUserName || "Call"}</h3>
                <p className="text-sm mb-4" style={{ color: BRAND.textMuted }}>
                  {webrtc.callState.status === "outgoing_ringing" ? "Ringing..." :
                   webrtc.callState.status === "connecting" ? "Connecting..." :
                   webrtc.callState.status === "reconnecting" ? "Reconnecting..." :
                   `${Math.floor(webrtc.callState.duration / 60)}:${(webrtc.callState.duration % 60).toString().padStart(2, "0")}`}
                </p>
                <div className="flex justify-center gap-4">
                  <button onClick={webrtc.toggleAudio}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${webrtc.callState.localAudioEnabled ? "bg-white/10" : ""}`}
                    style={!webrtc.callState.localAudioEnabled ? { backgroundColor: BRAND.error } : {}}>
                    {webrtc.callState.localAudioEnabled ? <Mic size={20} className="text-white" /> : <MicOff size={20} className="text-white" />}
                  </button>
                  {webrtc.callState.callType === "video" && (
                    <button onClick={webrtc.toggleVideo}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition ${webrtc.callState.localVideoEnabled ? "bg-white/10" : ""}`}
                      style={!webrtc.callState.localVideoEnabled ? { backgroundColor: BRAND.error } : {}}>
                      {webrtc.callState.localVideoEnabled ? <Video size={20} className="text-white" /> : <VideoOff size={20} className="text-white" />}
                    </button>
                  )}
                  <button onClick={() => webrtc.endCall()}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition" style={{ backgroundColor: BRAND.error }}>
                    <PhoneOff size={20} className="text-white" />
                  </button>
                </div>
              </>
            )}
            {webrtc.callState.status === "ended" && (
              <>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-white/10">
                  <PhoneOff size={28} style={{ color: BRAND.textMuted }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Call Ended</h3>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
