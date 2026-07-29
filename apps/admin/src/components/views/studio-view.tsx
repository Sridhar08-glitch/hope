"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Video,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  Search,
  Filter,
  Play,
  Clock,
  ThumbsUp,
  X,
  Music,
  Flag,
  FileWarning,
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
  Modal,
  ConfirmDialog,
  EmptyState,
  StatusBadge,
  GhostButton,
  fadeUp,
  cardStyle,
  subtleBorder,
  inputStyle,
  useDebouncedValue,
} from "@/components/shared";

/* ── Types ─────────────────────────────────────────── */

interface StudioVideo {
  id: string;
  title: string;
  description: string;
  status: string;
  visibility: string;
  trainer_id: number;
  trainer_username: string;
  trainer_email: string;
  sport: string;
  difficulty: string;
  duration_seconds: number | null;
  view_count: number;
  like_count: number;
  raw_r2_key: string;
  thumbnail_r2_key: string;
  error_message: string;
  moderation_result: Record<string, unknown> | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  raw_video_url?: string;
}

interface VideoListResponse {
  total: number;
  offset: number;
  page_size: number;
  results: StudioVideo[];
}

interface Appeal {
  id: number;
  video_id: string;
  video_title: string;
  trainer_username: string;
  reason: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string;
}

interface Report {
  id: number;
  video_id: string;
  video_title: string;
  reporter_username: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

/* ── Helpers ───────────────────────────────────────── */

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ── Info Field ────────────────────────────────────── */

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.textDim }}>{label}</p>
      <div className="mt-0.5 text-[12px]" style={{ color: BRAND.textMain }}>
        {typeof value === "string" ? <span className="capitalize">{value}</span> : value}
      </div>
    </div>
  );
}

type Tab = "videos" | "reports" | "appeals";

/* ── Main Component ────────────────────────────────── */

export default function StudioView({ api, showToast }: ViewProps) {
  const [tab, setTab] = useState<Tab>("videos");

  const tabs: { key: Tab; label: string; icon: typeof Video }[] = [
    { key: "videos", label: "Videos", icon: Video },
    { key: "reports", label: "Reports", icon: Flag },
    { key: "appeals", label: "Appeals", icon: FileWarning },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Studio & Content" subtitle="Manage trainer videos, review content, and handle appeals" />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "videos" && <VideosTab api={api} showToast={showToast} />}
      {tab === "reports" && <ReportsTab api={api} showToast={showToast} />}
      {tab === "appeals" && <AppealsTab api={api} showToast={showToast} />}
    </div>
  );
}

/* ── Videos Tab ────────────────────────────────────── */

function VideosTab({ api, showToast }: ViewProps) {
  const [videos, setVideos] = useState<StudioVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const pageSize = 20;

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [showFilters, setShowFilters] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [previewVideo, setPreviewVideo] = useState<StudioVideo | null>(null);
  const [rejectVideo, setRejectVideo] = useState<StudioVideo | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page_size: String(pageSize), offset: String(offset) };
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const res = await api.get<VideoListResponse>(`/admin/studio/videos/?${new URLSearchParams(params).toString()}`);
      setVideos(res?.results || []);
      setTotal(res?.total || 0);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to load videos", "error");
    } finally {
      setLoading(false);
    }
  }, [api, offset, statusFilter, debouncedSearch, showToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setOffset(0); }, [statusFilter, debouncedSearch]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selected.size === videos.length) setSelected(new Set());
    else setSelected(new Set(videos.map(v => v.id)));
  };

  async function handleApprove(id: string) {
    setActionLoading(true);
    try { await api.post(`/admin/studio/videos/${id}/approve/`, {}); showToast("Video approved -- transcoding started", "success"); load(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to approve", "error"); }
    finally { setActionLoading(false); }
  }

  async function handleReject() {
    if (!rejectVideo || !rejectReason.trim()) return;
    setActionLoading(true);
    try { await api.post(`/admin/studio/videos/${rejectVideo.id}/reject/`, { reason: rejectReason.trim() }); showToast("Video rejected", "success"); setRejectVideo(null); setRejectReason(""); load(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to reject", "error"); }
    finally { setActionLoading(false); }
  }

  async function handleRetrigger(id: string) {
    setActionLoading(true);
    try { await api.post(`/admin/studio/videos/${id}/retrigger/`, {}); showToast("Pipeline re-triggered", "success"); load(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to retrigger", "error"); }
    finally { setActionLoading(false); }
  }

  async function handleBulkAction() {
    if (!bulkAction || selected.size === 0) return;
    if (bulkAction === "reject" && !bulkRejectReason.trim()) { showToast("Reason is required for bulk reject", "error"); return; }
    setActionLoading(true);
    try {
      await api.post("/admin/studio/videos/bulk-action/", {
        action: bulkAction,
        video_ids: Array.from(selected),
        ...(bulkAction === "reject" ? { reason: bulkRejectReason.trim() } : {}),
      });
      showToast(`Bulk ${bulkAction} completed for ${selected.size} video(s)`, "success");
      setSelected(new Set()); setBulkAction(null); setBulkRejectReason(""); load();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Bulk action failed", "error"); }
    finally { setActionLoading(false); }
  }

  const statuses = ["", "under_review", "pending", "processing", "published", "rejected", "failed", "archived"];
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.floor(offset / pageSize) + 1;

  return (
    <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
          <input type="text" placeholder="Search by title..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle} />
        </div>
        <GhostButton onClick={() => setShowFilters(!showFilters)}>
          <Filter size={13} className="mr-1 inline" />Filters
        </GhostButton>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-1.5 p-3 rounded-lg" style={cardStyle}>
          <span className="text-[10px] font-medium self-center mr-1" style={{ color: BRAND.textDim }}>Status:</span>
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-2.5 py-1 rounded-md text-[10px] font-medium transition"
              style={{ backgroundColor: statusFilter === s ? `${BRAND.primary}18` : "transparent", color: statusFilter === s ? BRAND.textMain : BRAND.textDim }}>
              {s ? s.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()) : "All"}
            </button>
          ))}
        </div>
      )}

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: `${BRAND.primary}12` }}>
          <span className="text-[11px] font-medium" style={{ color: BRAND.accent }}>{selected.size} selected</span>
          <button onClick={() => setBulkAction("approve")} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.success}18`, color: BRAND.success }}>Approve</button>
          <button onClick={() => setBulkAction("reject")} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.error}18`, color: BRAND.error }}>Reject</button>
          <button onClick={() => setBulkAction("delete")} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.error}18`, color: BRAND.error }}>Delete</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-[10px] underline" style={{ color: BRAND.textMuted }}>Clear</button>
        </div>
      )}

      {/* Table */}
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : videos.length === 0 ? <EmptyState icon={Video} message="No videos found" /> : (
        <>
          <DataTable cols={["", "Video", "Trainer", "Sport", "Duration", "Views", "Status", "Uploaded", "Actions"]}>
            {videos.map(v => (
              <TR key={v.id}>
                <TD><input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleSelect(v.id)} className="accent-purple-500" /></TD>
                <TD>
                  <div className="max-w-[180px]">
                    <p className="text-[12px] font-medium truncate" style={{ color: BRAND.textMain }}>{v.title}</p>
                    <p className="text-[10px] truncate mt-0.5" style={{ color: BRAND.textDim }}>{v.description}</p>
                  </div>
                </TD>
                <TD>
                  <p className="text-[12px]" style={{ color: BRAND.textMain }}>{v.trainer_username}</p>
                  <p className="text-[10px]" style={{ color: BRAND.textDim }}>{v.trainer_email}</p>
                </TD>
                <TD><span className="text-[12px] capitalize">{v.sport}</span></TD>
                <TD>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock size={11} style={{ color: BRAND.textDim }} /> {formatDuration(v.duration_seconds)}
                  </span>
                </TD>
                <TD>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-0.5"><Eye size={11} style={{ color: BRAND.textDim }} /> {v.view_count}</span>
                    <span className="flex items-center gap-0.5"><ThumbsUp size={11} style={{ color: BRAND.textDim }} /> {v.like_count}</span>
                  </div>
                </TD>
                <TD><StatusBadge status={v.status} /></TD>
                <TD><span className="text-[10px]" style={{ color: BRAND.textDim }}>{formatDate(v.created_at)}</span></TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewVideo(v)} title="Preview" className="p-1 rounded hover:bg-white/5 transition"><Eye size={14} style={{ color: BRAND.info }} /></button>
                    {v.status === "under_review" && (
                      <>
                        <button onClick={() => handleApprove(v.id)} title="Approve" disabled={actionLoading} className="p-1 rounded hover:bg-white/5 transition"><CheckCircle size={14} style={{ color: BRAND.success }} /></button>
                        <button onClick={() => { setRejectVideo(v); setRejectReason(""); }} title="Reject" className="p-1 rounded hover:bg-white/5 transition"><XCircle size={14} style={{ color: BRAND.error }} /></button>
                      </>
                    )}
                    {v.status === "failed" && (
                      <button onClick={() => handleRetrigger(v.id)} title="Re-trigger" disabled={actionLoading} className="p-1 rounded hover:bg-white/5 transition"><RotateCcw size={14} style={{ color: BRAND.info }} /></button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </DataTable>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: BRAND.textDim }}>Showing {offset + 1}--{Math.min(offset + pageSize, total)} of {total}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setOffset(Math.max(0, offset - pageSize))} disabled={offset === 0} className="p-1.5 rounded-md transition disabled:opacity-30 hover:bg-white/5"><span className="text-[12px]" style={{ color: BRAND.textMuted }}>&lsaquo;</span></button>
              <span className="text-[11px] px-1.5" style={{ color: BRAND.textMain }}>{currentPage} / {totalPages}</span>
              <button onClick={() => setOffset(offset + pageSize)} disabled={offset + pageSize >= total} className="p-1.5 rounded-md transition disabled:opacity-30 hover:bg-white/5"><span className="text-[12px]" style={{ color: BRAND.textMuted }}>&rsaquo;</span></button>
            </div>
          </div>
        </>
      )}

      {/* ── Preview Modal ── */}
      {previewVideo && (
        <VideoPreviewModal
          video={previewVideo}
          api={api}
          onClose={() => setPreviewVideo(null)}
          onApprove={() => { handleApprove(previewVideo.id); setPreviewVideo(null); }}
          onReject={() => { setRejectVideo(previewVideo); setPreviewVideo(null); }}
          showToast={showToast}
        />
      )}

      {/* ── Reject Modal ── */}
      {rejectVideo && (
        <Modal title={`Reject: ${rejectVideo.title}`} onClose={() => setRejectVideo(null)}>
          <div className="space-y-3">
            <p className="text-[11px]" style={{ color: BRAND.textDim }}>Provide a reason for rejection. This will be shown to the trainer.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={4} className="w-full px-3 py-2.5 rounded-lg text-[12px] outline-none resize-none" style={inputStyle} />
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setRejectVideo(null)}>Cancel</GhostButton>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition disabled:opacity-50" style={{ backgroundColor: BRAND.error, color: "#fff" }}>
                {actionLoading ? <Spinner /> : "Reject Video"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Bulk Confirm ── */}
      {bulkAction && bulkAction !== "reject" && (
        <ConfirmDialog
          message={`${bulkAction === "approve" ? "Approve" : "Delete"} ${selected.size} video(s)?`}
          onConfirm={handleBulkAction}
          onCancel={() => setBulkAction(null)}
          confirmLabel={bulkAction === "approve" ? "Approve All" : "Delete All"}
          confirmColor={bulkAction === "approve" ? BRAND.success : BRAND.error}
        />
      )}

      {bulkAction === "reject" && (
        <Modal title={`Bulk Reject ${selected.size} Videos`} onClose={() => setBulkAction(null)}>
          <div className="space-y-3">
            <textarea value={bulkRejectReason} onChange={e => setBulkRejectReason(e.target.value)} placeholder="Reason for rejection (required)..." rows={3} className="w-full px-3 py-2.5 rounded-lg text-[12px] outline-none resize-none" style={inputStyle} />
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setBulkAction(null)}>Cancel</GhostButton>
              <button onClick={handleBulkAction} disabled={!bulkRejectReason.trim() || actionLoading} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition disabled:opacity-50" style={{ backgroundColor: BRAND.error, color: "#fff" }}>
                {actionLoading ? <Spinner /> : `Reject ${selected.size} Videos`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
}

/* ── Video Preview Modal ───────────────────────────── */

function VideoPreviewModal({ video, api, onClose, onApprove, onReject, showToast }: {
  video: StudioVideo;
  api: ApiClient;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  showToast: (message: string, type: "success" | "error") => void;
}) {
  const [detail, setDetail] = useState<StudioVideo | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [musicTracks, setMusicTracks] = useState<unknown[]>([]);

  useEffect(() => {
    (async () => {
      try { setDetail(await api.get<StudioVideo>(`/admin/studio/videos/${video.id}/`)); }
      catch { setDetail(video); }
      finally { setLoadingDetail(false); }
    })();
  }, [api, video]);

  useEffect(() => {
    (async () => {
      try { const res = await api.get<{ tracks: unknown[] }>(`/admin/studio/videos/${video.id}/music/`); setMusicTracks(res?.tracks || []); }
      catch { /* no music tracks */ }
    })();
  }, [api, video.id]);

  const v = detail || video;

  return (
    <Modal title="Video Preview" onClose={onClose} wide>
      {loadingDetail ? <div className="flex justify-center py-8"><Spinner /></div> : (
        <div className="space-y-5">
          {/* Video Player */}
          {v.raw_video_url ? (
            <div className="rounded-xl overflow-hidden bg-black aspect-video">
              <video src={v.raw_video_url} controls className="w-full h-full object-contain" controlsList="nodownload" />
            </div>
          ) : (
            <div className="rounded-xl bg-black/50 aspect-video flex items-center justify-center">
              <div className="text-center">
                <Play size={40} style={{ color: BRAND.textDim }} className="mx-auto mb-2" />
                <p className="text-[11px]" style={{ color: BRAND.textDim }}>Video preview not available</p>
              </div>
            </div>
          )}

          {/* Video Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Title" value={v.title} />
            <InfoField label="Status" value={<StatusBadge status={v.status} />} />
            <InfoField label="Trainer" value={`${v.trainer_username} (${v.trainer_email})`} />
            <InfoField label="Sport" value={v.sport} />
            <InfoField label="Difficulty" value={v.difficulty} />
            <InfoField label="Duration" value={formatDuration(v.duration_seconds)} />
            <InfoField label="Views" value={String(v.view_count)} />
            <InfoField label="Likes" value={String(v.like_count)} />
            <InfoField label="Visibility" value={v.visibility} />
            <InfoField label="Uploaded" value={formatDate(v.created_at)} />
            {v.published_at && <InfoField label="Published" value={formatDate(v.published_at)} />}
            {v.error_message && <div className="col-span-2"><InfoField label="Error / Note" value={v.error_message} /></div>}
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Description</p>
            <p className="text-[12px] leading-relaxed" style={{ color: BRAND.textMain }}>{v.description || "No description"}</p>
          </div>

          {/* Moderation Result */}
          {v.moderation_result && Object.keys(v.moderation_result).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Moderation Result</p>
              <pre className="text-[10px] p-3 rounded-lg overflow-auto" style={inputStyle}>{JSON.stringify(v.moderation_result, null, 2)}</pre>
            </div>
          )}

          {/* Music Tracks */}
          {musicTracks.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: BRAND.textDim }}><Music size={12} /> Music Tracks</p>
              <pre className="text-[10px] p-3 rounded-lg overflow-auto" style={inputStyle}>{JSON.stringify(musicTracks, null, 2)}</pre>
            </div>
          )}

          {/* Actions */}
          {v.status === "under_review" && (
            <div className="flex gap-2 pt-3" style={{ borderTop: subtleBorder }}>
              <button onClick={onApprove} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition hover:opacity-90" style={{ backgroundColor: BRAND.success, color: "#fff" }}>
                <CheckCircle size={14} /> Approve & Transcode
              </button>
              <button onClick={onReject} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition hover:opacity-90" style={{ backgroundColor: BRAND.error, color: "#fff" }}>
                <XCircle size={14} /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ── Reports Tab ───────────────────────────────────── */

function ReportsTab({ api, showToast }: ViewProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get<Report[] | { results?: Report[] }>("/admin/studio/reports/"); setReports(Array.isArray(res) ? res : (res?.results ?? [])); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to load reports", "error"); }
    finally { setLoading(false); }
  }, [api, showToast]);

  useEffect(() => { load(); }, [load]);

  async function handleResolve(id: number) {
    try { await api.post(`/admin/studio/reports/${id}/resolve/`, {}); showToast("Report resolved", "success"); load(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to resolve", "error"); }
  }

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;
  if (reports.length === 0) return <EmptyState icon={Flag} message="No content reports -- all clear!" />;

  return (
    <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
      <DataTable cols={["Video", "Reporter", "Reason", "Status", "Reported", "Actions"]}>
        {reports.map(r => (
          <TR key={r.id}>
            <TD><span className="text-[12px] font-medium">{r.video_title || `Video ${r.video_id}`}</span></TD>
            <TD><span className="text-[11px]">{r.reporter_username || "\u2014"}</span></TD>
            <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.reason || "\u2014"}</span></TD>
            <TD><StatusBadge status={r.status || "pending"} /></TD>
            <TD><span className="text-[10px]" style={{ color: BRAND.textDim }}>{formatDate(r.created_at)}</span></TD>
            <TD>
              {r.status === "pending" && (
                <button onClick={() => handleResolve(r.id)} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.success}18`, color: BRAND.success }}>Resolve</button>
              )}
            </TD>
          </TR>
        ))}
      </DataTable>
    </motion.div>
  );
}

/* ── Appeals Tab ───────────────────────────────────── */

function AppealsTab({ api, showToast }: ViewProps) {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectAppeal, setRejectAppeal] = useState<Appeal | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get<Appeal[] | { results?: Appeal[] }>("/admin/studio/appeals/"); setAppeals(Array.isArray(res) ? res : (res?.results ?? [])); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to load appeals", "error"); }
    finally { setLoading(false); }
  }, [api, showToast]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: number) {
    setActionLoading(true);
    try { await api.post(`/admin/studio/appeals/${id}/approve/`, {}); showToast("Appeal approved -- video reinstated", "success"); load(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to approve appeal", "error"); }
    finally { setActionLoading(false); }
  }

  async function handleReject() {
    if (!rejectAppeal) return;
    setActionLoading(true);
    try { await api.post(`/admin/studio/appeals/${rejectAppeal.id}/reject/`, { reason: rejectReason || undefined }); showToast("Appeal rejected", "success"); setRejectAppeal(null); setRejectReason(""); load(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to reject appeal", "error"); }
    finally { setActionLoading(false); }
  }

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;
  if (appeals.length === 0) return <EmptyState icon={FileWarning} message="No video appeals" />;

  return (
    <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
      <DataTable cols={["Video", "Trainer", "Appeal Reason", "Status", "Filed", "Actions"]}>
        {appeals.map(a => (
          <TR key={a.id}>
            <TD><span className="text-[12px] font-medium">{a.video_title || `Video ${a.video_id}`}</span></TD>
            <TD><span className="text-[11px]">{a.trainer_username || "\u2014"}</span></TD>
            <TD><span className="text-[11px] max-w-[180px] truncate block" style={{ color: BRAND.textDim }}>{a.reason || "\u2014"}</span></TD>
            <TD><StatusBadge status={a.status || "pending"} /></TD>
            <TD><span className="text-[10px]" style={{ color: BRAND.textDim }}>{formatDate(a.created_at)}</span></TD>
            <TD>
              {a.status === "pending" && (
                <div className="flex gap-1">
                  <button onClick={() => handleApprove(a.id)} disabled={actionLoading} className="p-1 rounded hover:bg-white/5 transition" title="Approve"><CheckCircle size={14} style={{ color: BRAND.success }} /></button>
                  <button onClick={() => { setRejectAppeal(a); setRejectReason(""); }} className="p-1 rounded hover:bg-white/5 transition" title="Reject"><XCircle size={14} style={{ color: BRAND.error }} /></button>
                </div>
              )}
            </TD>
          </TR>
        ))}
      </DataTable>

      {rejectAppeal && (
        <Modal title="Reject Appeal" onClose={() => setRejectAppeal(null)}>
          <div className="space-y-3">
            <p className="text-[11px]" style={{ color: BRAND.textDim }}>Optionally provide a reason. A default message will be used if left empty.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (optional)..." rows={3} className="w-full px-3 py-2.5 rounded-lg text-[12px] outline-none resize-none" style={inputStyle} />
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setRejectAppeal(null)}>Cancel</GhostButton>
              <button onClick={handleReject} disabled={actionLoading} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition disabled:opacity-50" style={{ backgroundColor: BRAND.error, color: "#fff" }}>
                {actionLoading ? <Spinner /> : "Reject Appeal"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
}
