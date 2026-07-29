"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { BRAND, Spinner, Badge, Button } from "@holora/ui";
import { MessageCircle, Pin, Trash2, Film, X, AlertTriangle } from "lucide-react";
import { formatRelativeTime } from "@holora/utils";

/* ── types ── */

interface CommentsViewProps {
  comments: any[];
  loading: boolean;
  onPinComment: (videoId: string, commentId: number) => void;
  onUnpinComment: (videoId: string, commentId: number) => void;
  onDeleteComment: (videoId: string, commentId: number) => void;
  showToast: (message: string, type: "success" | "error") => void;
}

/* ── constants ── */

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "pinned", label: "Pinned" },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]["key"];

/* ── helpers ── */

function getInitials(username: string | undefined): string {
  if (!username) return "?";
  return username
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/* ── component ── */

export function CommentsView({
  comments,
  loading,
  onPinComment,
  onUnpinComment,
  onDeleteComment,
  showToast,
}: CommentsViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    videoId: string;
    commentId: number;
  } | null>(null);

  /* ── derived data ── */

  const safeComments = Array.isArray(comments) ? comments : [];

  const filteredComments =
    activeFilter === "pinned"
      ? safeComments.filter((c: any) => c.is_pinned)
      : safeComments;

  const pinnedCount = safeComments.filter((c: any) => c.is_pinned).length;

  /* ── loading ── */

  if (loading) return <Spinner />;

  /* ── render ── */

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* ── header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl p-5 border border-purple-900/40 shadow-lg"
        style={{ backgroundColor: BRAND.panel }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${BRAND.primary}, #c026d3)`,
            }}
          >
            <MessageCircle size={20} className="text-white" />
          </div>
          <h2
            className="text-xl font-bold"
            style={{ color: BRAND.textMain }}
          >
            Comments
          </h2>
          <Badge color="purple">{safeComments.length}</Badge>
        </div>
      </div>

      {/* ── filter tabs ── */}
      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeFilter === tab.key
                ? "text-white shadow-[0_0_12px_rgba(126,34,206,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
            style={
              activeFilter === tab.key
                ? { backgroundColor: BRAND.primary }
                : {
                    backgroundColor: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }
            }
          >
            {tab.label}
            {tab.key === "pinned" && pinnedCount > 0 && (
              <span className="ml-1.5">({pinnedCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── comments list ── */}
      {filteredComments.length === 0 ? (
        <div
          className="rounded-3xl border border-purple-900/40 p-16 text-center"
          style={{ backgroundColor: BRAND.panel }}
        >
          <MessageCircle
            size={48}
            className="mx-auto mb-4"
            style={{ color: BRAND.textDim }}
          />
          <p
            className="text-lg font-semibold mb-2"
            style={{ color: BRAND.textMuted }}
          >
            {activeFilter === "pinned"
              ? "No pinned comments"
              : "No comments yet"}
          </p>
          <p className="text-sm" style={{ color: BRAND.textDim }}>
            {activeFilter === "pinned"
              ? "Pin comments to highlight them here"
              : "Comments on your videos will appear here"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredComments.map((comment: any) => {
            const user = comment.user ?? {};
            const isPinned = comment.is_pinned ?? false;
            const isDeleting =
              deleteConfirm?.commentId === comment.id &&
              deleteConfirm?.videoId === comment._video_id;
            const replies: any[] = Array.isArray(comment.replies)
              ? comment.replies
              : [];

            return (
              <div
                key={`${comment._video_id}-${comment.id}`}
                className="rounded-2xl p-4 border transition-colors hover:bg-black/10"
                style={{
                  backgroundColor: BRAND.panel,
                  borderColor: isPinned
                    ? "rgba(245,158,11,0.3)"
                    : "rgba(126,34,206,0.25)",
                  boxShadow: isPinned
                    ? "0 0 16px rgba(244,190,105,0.06)"
                    : undefined,
                }}
              >
                {isDeleting ? (
                  /* ── inline delete confirm ── */
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        size={16}
                        style={{ color: BRAND.warning }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: BRAND.textMain }}
                      >
                        Delete this comment?
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        color="gray"
                        small
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        color="red"
                        small
                        onClick={() => {
                          if (deleteConfirm) {
                            onDeleteComment(
                              deleteConfirm.videoId,
                              deleteConfirm.commentId
                            );
                          }
                          setDeleteConfirm(null);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── normal comment row ── */
                  <div className="flex items-start gap-3">
                    {/* avatar */}
                    <div className="shrink-0">
                      {user.avatar_url?.trim() ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username ?? "User"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, #7E22CE, #c026d3)",
                          }}
                        >
                          {getInitials(user.username)}
                        </div>
                      )}
                    </div>

                    {/* content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-medium"
                          style={{ color: BRAND.textMain }}
                        >
                          {user.username || "Unknown"}
                        </span>
                        {comment.created_at && (
                          <span
                            className="text-xs"
                            style={{ color: BRAND.textDim }}
                          >
                            {formatRelativeTime(comment.created_at)}
                          </span>
                        )}
                        {isPinned && (
                          <Pin
                            size={12}
                            style={{ color: BRAND.accent }}
                          />
                        )}
                      </div>

                      <p
                        className="text-sm mt-1 leading-relaxed"
                        style={{ color: "rgba(255,255,255,0.9)" }}
                      >
                        {comment.text}
                      </p>

                      {/* video context */}
                      {comment._video_title && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Film size={12} className="text-purple-400 shrink-0" />
                          <span className="text-xs text-purple-400 truncate">
                            On: {comment._video_title}
                          </span>
                        </div>
                      )}

                      {/* replies count */}
                      {replies.length > 0 && (
                        <p
                          className="text-xs mt-1.5"
                          style={{ color: BRAND.textDim }}
                        >
                          &mdash; {replies.length} repl
                          {replies.length === 1 ? "y" : "ies"}
                        </p>
                      )}
                    </div>

                    {/* actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          if (!comment._video_id) { showToast("Cannot pin — missing video context", "error"); return; }
                          isPinned
                            ? onUnpinComment(
                                comment._video_id,
                                comment.id
                              )
                            : onPinComment(
                                comment._video_id,
                                comment.id
                              );
                        }}
                        className="p-2 rounded-lg transition hover:bg-black/20"
                        title={isPinned ? "Unpin comment" : "Pin comment"}
                        aria-label={
                          isPinned ? "Unpin comment" : "Pin comment"
                        }
                      >
                        <Pin
                          size={16}
                          style={{
                            color: isPinned
                              ? BRAND.accent
                              : BRAND.textDim,
                          }}
                          fill={isPinned ? BRAND.accent : "none"}
                        />
                      </button>
                      <button
                        onClick={() => {
                          if (!comment._video_id) { showToast("Cannot delete — missing video context", "error"); return; }
                          setDeleteConfirm({
                            videoId: comment._video_id,
                            commentId: comment.id,
                          });
                        }}
                        className="p-2 rounded-lg transition hover:bg-red-500/20"
                        title="Delete comment"
                        aria-label="Delete comment"
                      >
                        <Trash2
                          size={16}
                          style={{ color: BRAND.error }}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
