"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback, useEffect, useRef } from "react";
import Hls from "hls.js";
import { BRAND, Spinner, Badge, Button } from "@holora/ui";
import {
  Search,
  Upload,
  Film,
  Eye,
  Heart,
  MessageSquare,
  Clock,
  Copy,
  Archive,
  RotateCcw,
  Trash2,
  Calendar,
  Play,
  Edit3,
  ChevronDown,
  CheckSquare,
  Square,
  X,
  Lock,
  Globe,
  Users as UsersIcon,
  Zap,
} from "lucide-react";
import { formatDate, formatDateTime } from "@holora/utils";
import { trainerApi } from "@/lib/trainer-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MyVideosViewProps {
  videos: any[];
  loading: boolean;
  nextCursor: string | null;
  statusFilter: string;
  searchQuery: string;
  selectedVideos: string[];
  onStatusFilterChange: (status: string) => void;
  onSearchChange: (query: string) => void;
  onLoadMore: () => void;
  onSelectVideo: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onEditVideo: (video: any) => void;
  onDeleteVideo: (id: string) => void;
  onArchiveVideo: (id: string) => void;
  onRestoreVideo: (id: string) => void;
  onDuplicateVideo: (id: string) => void;
  onScheduleVideo: (id: string, scheduledAt: string) => void;
  onCancelSchedule: (id: string) => void;
  onMoveToDraft: (id: string) => void;
  onProcessVideo: (id: string) => void;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
  onBulkAccessType: (accessType: string) => void;
  onNavigateToUpload: () => void;
  showToast: (message: string, type: "success" | "error") => void;
  api?: any;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, "gray" | "blue" | "yellow" | "green" | "red" | "purple"> = {
  DRAFT: "gray",
  SCHEDULED: "blue",
  PENDING: "yellow",
  VALIDATING: "yellow",
  SCANNING: "yellow",
  MODERATING: "yellow",
  TRANSCODING: "yellow",
  PACKAGING: "yellow",
  THUMBNAILING: "yellow",
  PUBLISHED: "green",
  FAILED: "red",
  REJECTED: "red",
  UNDER_REVIEW: "yellow",
  ARCHIVED: "purple",
};

const PROCESSING_STATUSES = [
  "PENDING",
  "VALIDATING",
  "SCANNING",
  "MODERATING",
  "TRANSCODING",
  "PACKAGING",
  "THUMBNAILING",
];

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Drafts" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PUBLISHED", label: "Published" },
  { value: "FAILED", label: "Failed" },
  { value: "ARCHIVED", label: "Archived" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "subscribers", label: "Subscribers" },
  { value: "private", label: "Private" },
];

const CONTENT_TYPE_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "premium", label: "Premium" },
  { value: "coin_gated", label: "Coin Gated" },
];

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

const AUDIO_LICENSE_OPTIONS = [
  { value: "ORIGINAL", label: "Original" },
  { value: "EPIDEMIC_SOUND", label: "Epidemic Sound" },
  { value: "OTHER_LICENSED", label: "Other Licensed" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function statusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function isProcessing(status: string): boolean {
  return PROCESSING_STATUSES.includes(status);
}

// ---------------------------------------------------------------------------
// Inline sub-components: Modals
// ---------------------------------------------------------------------------

interface EditModalProps {
  video: any;
  onSave: (updated: any) => void;
  onClose: () => void;
}

function EditModal({ video, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState({
    title: video.title ?? "",
    description: video.description ?? "",
    visibility: video.visibility ?? "public",
    content_type: video.content_type ?? "free",
    difficulty: video.difficulty ?? "beginner",
    is_short: video.is_short ?? false,
    audio_license: video.audio_license ?? "ORIGINAL",
  });

  const set = useCallback(
    (key: string, value: string | boolean) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleSave = () => {
    onSave({ ...video, ...form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* card */}
      <div
        className="relative w-full max-w-lg rounded-2xl border border-purple-900/40 shadow-2xl overflow-hidden"
        style={{ backgroundColor: BRAND.panel }}
      >
        {/* header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "rgba(126, 34, 206, 0.25)" }}
        >
          <h3 className="text-lg font-bold" style={{ color: BRAND.textMain }}>
            Edit Video
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} style={{ color: BRAND.textMuted }} />
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* title */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: BRAND.textMuted }}>
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 transition"
              style={{ backgroundColor: BRAND.input, color: BRAND.textMain }}
            />
          </div>

          {/* description */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: BRAND.textMuted }}>
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-purple-500/50 transition"
              style={{ backgroundColor: BRAND.input, color: BRAND.textMain }}
            />
          </div>

          {/* visibility + content_type row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: BRAND.textMuted }}>
                Visibility
              </label>
              <select
                value={form.visibility}
                onChange={(e) => set("visibility", e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 transition appearance-none cursor-pointer"
                style={{ backgroundColor: BRAND.input, color: BRAND.textMain }}
              >
                {VISIBILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: BRAND.textMuted }}>
                Content Type
              </label>
              <select
                value={form.content_type}
                onChange={(e) => set("content_type", e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 transition appearance-none cursor-pointer"
                style={{ backgroundColor: BRAND.input, color: BRAND.textMain }}
              >
                {CONTENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* difficulty + audio_license row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: BRAND.textMuted }}>
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => set("difficulty", e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 transition appearance-none cursor-pointer"
                style={{ backgroundColor: BRAND.input, color: BRAND.textMain }}
              >
                {DIFFICULTY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: BRAND.textMuted }}>
                Audio License
              </label>
              <select
                value={form.audio_license}
                onChange={(e) => set("audio_license", e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 transition appearance-none cursor-pointer"
                style={{ backgroundColor: BRAND.input, color: BRAND.textMain }}
              >
                {AUDIO_LICENSE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* is_short toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_short}
              onChange={(e) => set("is_short", e.target.checked)}
              className="w-4 h-4 rounded accent-purple-600"
            />
            <span className="text-sm" style={{ color: BRAND.textMain }}>
              Short-form video (vertical / &lt; 60s)
            </span>
          </label>
        </div>

        {/* footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: "rgba(126, 34, 206, 0.25)" }}
        >
          <Button color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button color="purple" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Schedule Modal -------------------------------------------------------

interface ScheduleModalProps {
  videoId: string;
  currentSchedule?: string | null;
  onSchedule: (id: string, scheduledAt: string) => void;
  onClose: () => void;
}

function ScheduleModal({ videoId, currentSchedule, onSchedule, onClose }: ScheduleModalProps) {
  const [scheduledAt, setScheduledAt] = useState(currentSchedule ?? "");

  const handleSubmit = () => {
    if (!scheduledAt) return;
    onSchedule(videoId, scheduledAt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-purple-900/40 shadow-2xl overflow-hidden"
        style={{ backgroundColor: BRAND.panel }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "rgba(126, 34, 206, 0.25)" }}
        >
          <h3 className="text-lg font-bold" style={{ color: BRAND.textMain }}>
            Schedule Publish
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} style={{ color: BRAND.textMuted }} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: BRAND.textMuted }}>
              Publish Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 transition"
              style={{ backgroundColor: BRAND.input, color: BRAND.textMain }}
            />
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: "rgba(126, 34, 206, 0.25)" }}
        >
          <Button color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button color="purple" onClick={handleSubmit} disabled={!scheduledAt}>
            Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Confirm Delete Modal -------------------------------------------------

interface ConfirmDeleteModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmDeleteModal({ onConfirm, onClose }: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-purple-900/40 shadow-2xl overflow-hidden"
        style={{ backgroundColor: BRAND.panel }}
      >
        <div className="px-6 py-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.15)" }}
            >
              <Trash2 size={18} style={{ color: BRAND.error }} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: BRAND.textMain }}>
              Delete Video
            </h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
            Are you sure you want to delete this video? This action cannot be
            undone.
          </p>
        </div>
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: "rgba(126, 34, 206, 0.25)" }}
        >
          <Button color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline sub-component: Video Card
// ---------------------------------------------------------------------------

interface VideoCardProps {
  video: any;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (video: any) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSchedule: (id: string) => void;
  onCancelSchedule: (id: string) => void;
  onMoveToDraft: (id: string) => void;
  onProcess: (id: string) => void;
  onPlay?: (video: any) => void;
}

function VideoCard({
  video,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onDuplicate,
  onSchedule,
  onCancelSchedule,
  onMoveToDraft,
  onProcess,
  onPlay,
}: VideoCardProps) {
  const status: string = (video.status ?? "DRAFT").toUpperCase();
  const processing = isProcessing(status);

  // Content type badge info
  const contentTypeMap: Record<string, { label: string; color: "green" | "purple" | "yellow" }> = {
    free: { label: "Free", color: "green" },
    premium: { label: "Premium", color: "purple" },
    coin_gated: { label: "Coin", color: "yellow" },
  };
  const ct = contentTypeMap[video.content_type] ?? contentTypeMap.free;

  // Visibility icon
  const VisIcon =
    video.visibility === "private"
      ? Lock
      : video.visibility === "subscribers"
        ? UsersIcon
        : Globe;

  return (
    <div
      className="rounded-2xl border border-purple-900/40 overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
      style={{ backgroundColor: BRAND.panel }}
    >
      {/* ---- Thumbnail area ---- */}
      <div className="relative aspect-video overflow-hidden">
        {/* Selection checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(video.id);
          }}
          className="absolute top-3 left-3 z-10 p-1 rounded-lg bg-black/40 hover:bg-black/60 transition-colors"
          title={isSelected ? "Deselect" : "Select"}
        >
          {isSelected ? (
            <CheckSquare size={18} style={{ color: BRAND.primary }} />
          ) : (
            <Square size={18} style={{ color: BRAND.textMuted }} />
          )}
        </button>

        {/* Thumbnail or placeholder */}
        {(video.thumbnail_url || video.thumbnail_r2_key) ? (
          <img
            src={video.thumbnail_url || video.thumbnail_r2_key}
            alt={video.title ?? "Video thumbnail"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/60 to-purple-800/30"
          >
            <Film size={40} style={{ color: BRAND.textDim }} />
          </div>
        )}

        {/* Play button overlay for published videos */}
        {status === "PUBLISHED" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.(video);
            }}
            className="absolute inset-0 z-[5] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: BRAND.primary, boxShadow: `0 0 20px ${BRAND.primary}60` }}
            >
              <Play size={24} className="text-white ml-1" fill="white" />
            </div>
          </button>
        )}

        {/* Status badge top-right */}
        <div className="absolute top-3 right-3 z-10">
          <Badge color={STATUS_COLORS[status] ?? "gray"}>
            {statusLabel(status)}
          </Badge>
        </div>

        {/* Duration badge bottom-right */}
        <div className="absolute bottom-3 right-3 z-10">
          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-black/70 text-white">
            {formatDuration(video.duration_seconds ?? null)}
          </span>
        </div>

        {/* Processing overlay */}
        {processing && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 animate-pulse">
            <Zap size={24} className="text-yellow-400 mb-2" />
            <span className="text-xs font-semibold text-yellow-300">
              {statusLabel(status)}...
            </span>
          </div>
        )}
      </div>

      {/* ---- Content area ---- */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3
          className="font-semibold text-sm line-clamp-1"
          style={{ color: BRAND.textMain }}
          title={video.title}
        >
          {video.title || "Untitled Video"}
        </h3>

        {/* Description */}
        {video.description && (
          <p
            className="text-xs line-clamp-2 leading-relaxed"
            style={{ color: BRAND.textMuted }}
          >
            {video.description}
          </p>
        )}

        {/* Metrics row */}
        <div className="flex items-center gap-4 text-xs" style={{ color: BRAND.textMuted }}>
          <span className="flex items-center gap-1">
            <Eye size={13} /> {video.view_count ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={13} /> {video.like_count ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={13} /> {video.comment_count ?? 0}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Badge color={ct.color}>{ct.label}</Badge>
            <VisIcon size={14} style={{ color: BRAND.textMuted }} />
          </div>
          <span style={{ color: BRAND.textDim }}>
            {formatDate(video.published_at ?? video.created_at ?? "")}
          </span>
        </div>

        {/* Scheduled info */}
        {status === "SCHEDULED" && video.scheduled_at && (
          <div
            className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5"
            style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: BRAND.info }}
          >
            <Calendar size={13} />
            <span>Scheduled: {formatDateTime(video.scheduled_at)}</span>
          </div>
        )}

        {/* Failure reason */}
        {status === "FAILED" && video.failure_reason && (
          <div
            className="text-xs rounded-lg px-2.5 py-1.5 line-clamp-2"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: BRAND.error }}
            title={video.failure_reason}
          >
            {video.failure_reason}
          </div>
        )}

        {/* ---- Actions row ---- */}
        <div
          className="flex items-center justify-end gap-1.5 pt-2 border-t"
          style={{ borderColor: "rgba(126, 34, 206, 0.15)" }}
        >
          {processing ? (
            <span className="text-xs flex items-center gap-1.5" style={{ color: BRAND.textDim }}>
              <Clock size={13} className="animate-spin" /> Processing...
            </span>
          ) : (
            <VideoActions
              status={status}
              video={video}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
              onRestore={onRestore}
              onDuplicate={onDuplicate}
              onSchedule={onSchedule}
              onCancelSchedule={onCancelSchedule}
              onMoveToDraft={onMoveToDraft}
              onProcess={onProcess}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline sub-component: Video Actions (status-dependent buttons)
// ---------------------------------------------------------------------------

interface VideoActionsProps {
  status: string;
  video: any;
  onEdit: (video: any) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSchedule: (id: string) => void;
  onCancelSchedule: (id: string) => void;
  onMoveToDraft: (id: string) => void;
  onProcess: (id: string) => void;
}

function VideoActions({
  status,
  video,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onDuplicate,
  onSchedule,
  onCancelSchedule,
  onMoveToDraft,
  onProcess,
}: VideoActionsProps) {
  const iconBtnCls =
    "p-2 rounded-lg hover:bg-white/10 transition-colors";

  switch (status) {
    case "DRAFT":
      return (
        <>
          <button
            onClick={() => onEdit(video)}
            className={iconBtnCls}
            title="Edit"
          >
            <Edit3 size={15} style={{ color: BRAND.textMuted }} />
          </button>
          <button
            onClick={() => onProcess(video.id)}
            className={iconBtnCls}
            title="Submit for Processing"
          >
            <Play size={15} style={{ color: BRAND.success }} />
          </button>
          <button
            onClick={() => onSchedule(video.id)}
            className={iconBtnCls}
            title="Schedule"
          >
            <Calendar size={15} style={{ color: BRAND.info }} />
          </button>
          <button
            onClick={() => onDelete(video.id)}
            className={iconBtnCls}
            title="Delete"
          >
            <Trash2 size={15} style={{ color: BRAND.error }} />
          </button>
        </>
      );

    case "PUBLISHED":
      return (
        <>
          <button
            onClick={() => onEdit(video)}
            className={iconBtnCls}
            title="Edit"
          >
            <Edit3 size={15} style={{ color: BRAND.textMuted }} />
          </button>
          <button
            onClick={() => onArchive(video.id)}
            className={iconBtnCls}
            title="Archive"
          >
            <Archive size={15} style={{ color: BRAND.warning }} />
          </button>
          <button
            onClick={() => onDuplicate(video.id)}
            className={iconBtnCls}
            title="Duplicate"
          >
            <Copy size={15} style={{ color: BRAND.textMuted }} />
          </button>
          <button
            onClick={() => onDelete(video.id)}
            className={iconBtnCls}
            title="Delete"
          >
            <Trash2 size={15} style={{ color: BRAND.error }} />
          </button>
        </>
      );

    case "ARCHIVED":
      return (
        <>
          <button
            onClick={() => onRestore(video.id)}
            className={iconBtnCls}
            title="Restore"
          >
            <RotateCcw size={15} style={{ color: BRAND.success }} />
          </button>
          <button
            onClick={() => onDelete(video.id)}
            className={iconBtnCls}
            title="Delete"
          >
            <Trash2 size={15} style={{ color: BRAND.error }} />
          </button>
        </>
      );

    case "FAILED":
      return (
        <>
          <button
            onClick={() => onEdit(video)}
            className={iconBtnCls}
            title="Edit"
          >
            <Edit3 size={15} style={{ color: BRAND.textMuted }} />
          </button>
          <button
            onClick={() => onMoveToDraft(video.id)}
            className={iconBtnCls}
            title="Move to Draft"
          >
            <RotateCcw size={15} style={{ color: BRAND.info }} />
          </button>
          <button
            onClick={() => onDelete(video.id)}
            className={iconBtnCls}
            title="Delete"
          >
            <Trash2 size={15} style={{ color: BRAND.error }} />
          </button>
        </>
      );

    case "REJECTED":
      return (
        <>
          <button
            onClick={() => onMoveToDraft(video.id)}
            className={iconBtnCls}
            title="Move to Draft"
          >
            <RotateCcw size={15} style={{ color: BRAND.info }} />
          </button>
          <button
            onClick={() => onDelete(video.id)}
            className={iconBtnCls}
            title="Delete"
          >
            <Trash2 size={15} style={{ color: BRAND.error }} />
          </button>
        </>
      );

    case "SCHEDULED":
      return (
        <>
          <button
            onClick={() => onEdit(video)}
            className={iconBtnCls}
            title="Edit"
          >
            <Edit3 size={15} style={{ color: BRAND.textMuted }} />
          </button>
          <button
            onClick={() => onCancelSchedule(video.id)}
            className={iconBtnCls}
            title="Cancel Schedule"
          >
            <X size={15} style={{ color: BRAND.warning }} />
          </button>
          <button
            onClick={() => onDelete(video.id)}
            className={iconBtnCls}
            title="Delete"
          >
            <Trash2 size={15} style={{ color: BRAND.error }} />
          </button>
        </>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

// HLS-aware video player — works in Chrome, Firefox, Safari
function HlsPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    // If native HLS support (Safari), use <video src> directly
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play().catch(() => {});
      return;
    }

    // Use hls.js for Chrome/Firefox
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else {
            hls.destroy();
          }
        }
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    // Fallback — try direct src (may not work for m3u8)
    video.src = url;
    video.play().catch(() => {});
  }, [url]);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      playsInline
      className="w-full aspect-video"
      style={{ backgroundColor: "#000" }}
    />
  );
}

export function MyVideosView({
  videos,
  loading,
  nextCursor,
  statusFilter,
  searchQuery,
  selectedVideos,
  onStatusFilterChange,
  onSearchChange,
  onLoadMore,
  onSelectVideo,
  onSelectAll,
  onDeselectAll,
  onEditVideo,
  onDeleteVideo,
  onArchiveVideo,
  onRestoreVideo,
  onDuplicateVideo,
  onScheduleVideo,
  onCancelSchedule,
  onMoveToDraft,
  onProcessVideo,
  onBulkArchive,
  onBulkDelete,
  onBulkAccessType,
  onNavigateToUpload,
  showToast,
  api,
}: MyVideosViewProps) {
  // Local modal state
  const [editingVideo, setEditingVideo] = useState<any | null>(null);
  const [schedulingVideoId, setSchedulingVideoId] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);

  // Video player state
  const [playingVideo, setPlayingVideo] = useState<any | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);

  const handlePlayVideo = useCallback(async (video: any) => {
    if (!api) { showToast("Unable to play video", "error"); return; }
    const status = (video.status || "").toUpperCase();
    if (status === "PENDING" || status === "VALIDATING" || status === "SCANNING" || status === "MODERATING" || status === "TRANSCODING" || status === "PACKAGING" || status === "THUMBNAILING" || status === "MIXING") {
      showToast("This video is still being processed. Please wait.", "error"); return;
    }
    if (status === "UNDER_REVIEW") {
      showToast("This video is under review and cannot be played yet.", "error"); return;
    }
    if (status === "FAILED") {
      showToast("This video failed to process. Please re-upload.", "error"); return;
    }
    if (status === "REJECTED") {
      showToast("This video was rejected and cannot be played.", "error"); return;
    }
    if (status === "DRAFT") {
      showToast("This video is a draft. Process it first to play.", "error"); return;
    }
    setPlayingVideo(video);
    setStreamUrl(null);
    setPlayerLoading(true);
    try {
      const data = await trainerApi.studio.getStreamUrl(api, video.id);
      // Backend returns { master_playlist_url, expires_in }
      const url = data?.master_playlist_url || data?.stream_url || data?.url || "";
      if (!url) throw new Error("No stream URL available");
      setStreamUrl(url);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        showToast("Video not ready for playback yet — it may still be processing.", "error");
      } else if (status === 403) {
        showToast("You don't have access to play this video.", "error");
      } else {
        showToast("Failed to load video stream. Please try again.", "error");
      }
      setPlayingVideo(null);
    } finally {
      setPlayerLoading(false);
    }
  }, [api, showToast]);

  const closePlayer = useCallback(() => {
    setPlayingVideo(null);
    setStreamUrl(null);
  }, []);

  // Find the video being scheduled (for pre-populating existing schedule)
  const schedulingVideo = schedulingVideoId
    ? videos.find((v) => v.id === schedulingVideoId)
    : null;

  // ---- Handlers ----

  const handleEdit = useCallback((video: any) => {
    setEditingVideo(video);
  }, []);

  const handleEditSave = useCallback(
    (updated: any) => {
      onEditVideo(updated);
      setEditingVideo(null);
    },
    [onEditVideo],
  );

  const handleDeleteClick = useCallback((id: string) => {
    setDeletingVideoId(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deletingVideoId) {
      onDeleteVideo(deletingVideoId);
      setDeletingVideoId(null);
    }
  }, [deletingVideoId, onDeleteVideo]);

  const handleScheduleClick = useCallback((id: string) => {
    setSchedulingVideoId(id);
  }, []);

  const handleScheduleSubmit = useCallback(
    (id: string, scheduledAt: string) => {
      onScheduleVideo(id, scheduledAt);
      setSchedulingVideoId(null);
    },
    [onScheduleVideo],
  );

  const hasSelection = selectedVideos.length > 0;
  const filtersActive = statusFilter !== "" || searchQuery.trim() !== "";

  // Count videos per status tab (for badges)
  const statusCounts: Record<string, number> = {};
  videos.forEach((v) => {
    const s = v.status ?? "DRAFT";
    if (isProcessing(s)) {
      statusCounts["PROCESSING"] = (statusCounts["PROCESSING"] ?? 0) + 1;
    }
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-20">
      {/* ================================================================= */}
      {/* HEADER */}
      {/* ================================================================= */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl p-5 border border-purple-900/40 shadow-lg"
        style={{ backgroundColor: BRAND.panel }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(126, 34, 206, 0.2)" }}
          >
            <Film size={20} style={{ color: BRAND.primary }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: BRAND.textMain }}>
            My Videos
          </h2>
        </div>

        <button
          onClick={onNavigateToUpload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 shadow-lg shadow-purple-900/30 transition-all"
        >
          <Upload size={16} />
          Upload Video
        </button>
      </div>

      {/* ================================================================= */}
      {/* FILTER BAR */}
      {/* ================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: BRAND.textDim }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search videos..."
            className="w-full rounded-xl pl-10 pr-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 transition"
            style={{ backgroundColor: BRAND.input, color: BRAND.textMain }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-white/10 transition-colors"
            >
              <X size={14} style={{ color: BRAND.textMuted }} />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            const count =
              tab.value === ""
                ? videos.length
                : tab.value === "PROCESSING"
                  ? statusCounts["PROCESSING"] ?? 0
                  : statusCounts[tab.value] ?? 0;

            return (
              <button
                key={tab.value}
                onClick={() => onStatusFilterChange(tab.value)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "text-white shadow-md"
                    : "border border-white/10 hover:bg-white/5"
                }`}
                style={
                  isActive
                    ? { backgroundColor: BRAND.primary, color: "#fff" }
                    : { color: BRAND.textMuted }
                }
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* BULK ACTIONS BAR */}
      {/* ================================================================= */}
      {hasSelection && (
        <div className="rounded-2xl p-3 border border-purple-500/30 bg-purple-900/30 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: selection info */}
            <div className="flex items-center gap-3 text-sm" style={{ color: BRAND.textMain }}>
              <span className="font-semibold">
                {selectedVideos.length} selected
              </span>
              <button
                onClick={onSelectAll}
                className="text-xs underline hover:no-underline transition"
                style={{ color: BRAND.accent }}
              >
                Select All
              </button>
              <button
                onClick={onDeselectAll}
                className="text-xs underline hover:no-underline transition"
                style={{ color: BRAND.textMuted }}
              >
                Deselect All
              </button>
            </div>

            {/* Right: bulk action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button color="gray" small onClick={onBulkArchive}>
                <span className="flex items-center gap-1.5">
                  <Archive size={13} /> Archive
                </span>
              </Button>
              <Button color="red" small onClick={onBulkDelete}>
                <span className="flex items-center gap-1.5">
                  <Trash2 size={13} /> Delete
                </span>
              </Button>

              {/* Access type dropdown */}
              <div className="relative">
                <Button
                  color="gray"
                  small
                  onClick={() => setShowAccessDropdown((p) => !p)}
                >
                  <span className="flex items-center gap-1.5">
                    <Globe size={13} /> Change Access
                    <ChevronDown size={12} />
                  </span>
                </Button>
                {showAccessDropdown && (
                  <>
                    {/* Click-outside overlay */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowAccessDropdown(false)}
                    />
                    <div
                      className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl border border-purple-900/40 shadow-xl overflow-hidden"
                      style={{ backgroundColor: BRAND.panel }}
                    >
                      {CONTENT_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            onBulkAccessType(opt.value);
                            setShowAccessDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-white/10 transition-colors"
                          style={{ color: BRAND.textMain }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* LOADING STATE */}
      {/* ================================================================= */}
      {loading && videos.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      )}

      {/* ================================================================= */}
      {/* VIDEO CARDS GRID */}
      {/* ================================================================= */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isSelected={selectedVideos.includes(video.id)}
              onToggleSelect={onSelectVideo}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onArchive={onArchiveVideo}
              onRestore={onRestoreVideo}
              onDuplicate={onDuplicateVideo}
              onSchedule={handleScheduleClick}
              onCancelSchedule={onCancelSchedule}
              onMoveToDraft={onMoveToDraft}
              onProcess={onProcessVideo}
              onPlay={handlePlayVideo}
            />
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* EMPTY STATE */}
      {/* ================================================================= */}
      {!loading && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(126, 34, 206, 0.1)" }}
          >
            <Film size={40} style={{ color: BRAND.textDim }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: BRAND.textMain }}>
            No videos found
          </h3>
          {filtersActive && (
            <p className="text-sm" style={{ color: BRAND.textMuted }}>
              Try adjusting your filters or search query.
            </p>
          )}
          <button
            onClick={onNavigateToUpload}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 shadow-lg shadow-purple-900/30 transition-all mt-2"
          >
            <Upload size={16} />
            Upload Your First Video
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* LOAD MORE */}
      {/* ================================================================= */}
      {nextCursor && !loading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border border-white/10 hover:bg-white/5 transition-colors"
            style={{ color: BRAND.textMuted }}
          >
            Load More Videos
            <ChevronDown size={16} />
          </button>
        </div>
      )}

      {/* Loading indicator when fetching next page */}
      {loading && videos.length > 0 && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALS */}
      {/* ================================================================= */}
      {editingVideo && (
        <EditModal
          key={editingVideo.id}
          video={editingVideo}
          onSave={handleEditSave}
          onClose={() => setEditingVideo(null)}
        />
      )}

      {schedulingVideoId && (
        <ScheduleModal
          videoId={schedulingVideoId}
          currentSchedule={schedulingVideo?.scheduled_at ?? null}
          onSchedule={handleScheduleSubmit}
          onClose={() => setSchedulingVideoId(null)}
        />
      )}

      {deletingVideoId && (
        <ConfirmDeleteModal
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingVideoId(null)}
        />
      )}

      {/* ================================================================= */}
      {/*  Video Player Modal                                               */}
      {/* ================================================================= */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={closePlayer}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: "#000" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closePlayer}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
            >
              <X size={20} className="text-white" />
            </button>

            {/* Video title */}
            <div className="absolute top-4 left-4 z-20 max-w-[60%]">
              <h3 className="text-white font-semibold text-sm truncate drop-shadow-lg">
                {playingVideo.title || "Untitled"}
              </h3>
              <p className="text-white/60 text-xs mt-0.5">
                {playingVideo.view_count?.toLocaleString() || 0} views
              </p>
            </div>

            {/* Player */}
            {playerLoading ? (
              <div className="aspect-video flex items-center justify-center">
                <Spinner />
              </div>
            ) : streamUrl ? (
              <HlsPlayer url={streamUrl} />
            ) : (
              <div className="aspect-video flex items-center justify-center">
                <p className="text-white/50 text-sm">Unable to load video</p>
              </div>
            )}

            {/* Video info bar */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ backgroundColor: BRAND.panel }}
            >
              <div className="flex items-center gap-4 text-xs" style={{ color: BRAND.textMuted }}>
                <span className="flex items-center gap-1"><Eye size={12} /> {playingVideo.view_count?.toLocaleString() || 0}</span>
                <span className="flex items-center gap-1"><Heart size={12} /> {playingVideo.like_count?.toLocaleString() || 0}</span>
                <span className="flex items-center gap-1"><MessageSquare size={12} /> {playingVideo.comment_count?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={STATUS_COLORS[(playingVideo.status || "").toUpperCase()] ?? "gray"}>
                  {statusLabel((playingVideo.status || "").toUpperCase())}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
