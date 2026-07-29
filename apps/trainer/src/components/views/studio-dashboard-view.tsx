"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { BRAND, Spinner, StatCard } from "@holora/ui";
import {
  Clock,
  Film,
  Upload,
  BarChart3,
  TrendingUp,
  Play,
  ArrowRight,
} from "lucide-react";

interface StudioDashboardViewProps {
  data: any;
  loading: boolean;
  onNavigate: (tab: string) => void;
  showToast: (message: string, type: "success" | "error") => void;
}

/* ── helpers ── */

function formatWatchTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatHour(utcHour: number | null): string {
  if (utcHour === null || utcHour === undefined) return "No data";
  const date = new Date();
  date.setUTCHours(utcHour, 0, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function toHours(seconds: number): number {
  return Math.round((seconds / 3600) * 10) / 10;
}

/* ── retention funnel labels ── */

const FUNNEL_STEPS: { key: string; label: string }[] = [
  { key: "started", label: "Started" },
  { key: "reached_5m", label: "5 min" },
  { key: "reached_10m", label: "10 min" },
  { key: "reached_20m", label: "20 min" },
  { key: "reached_half", label: "50%" },
];

/* ── video status dot colors ── */

const STATUS_DOTS: { key: string; label: string; color: string }[] = [
  { key: "draft", label: "Draft", color: "#94a3b8" },
  { key: "scheduled", label: "Scheduled", color: "#3b82f6" },
  { key: "published", label: "Published", color: "#10b981" },
  { key: "processing", label: "Processing", color: "#f59e0b" },
  { key: "failed", label: "Failed", color: "#ef4444" },
  { key: "under_review", label: "Under Review", color: "#eab308" },
  { key: "archived", label: "Archived", color: "#a855f7" },
];

/* ── component ── */

export function StudioDashboardView({
  data,
  loading,
  onNavigate,
  showToast,
}: StudioDashboardViewProps) {
  if (loading) return <Spinner />;

  const todayViews = data?.today_views ?? 0;
  const totalWatchSeconds = data?.total_watch_time_seconds ?? 0;
  const followersTotal = data?.followers?.total ?? 0;
  const followersNew = data?.followers?.new_today ?? 0;
  const publishedCount = data?.video_counts?.published ?? 0;

  const fullVideoHours = data?.watch_time?.full_video_hours ?? 0;
  const shortsHours = toHours(data?.watch_time?.shorts_seconds ?? 0);
  const maxWatchHours = Math.max(fullVideoHours, shortsHours, 1);

  const funnel = data?.segment_funnel;
  const funnelStarted = funnel?.started ?? 0;

  const videoCounts = { draft: 0, scheduled: 0, published: 0, processing: 0, failed: 0, under_review: 0, archived: 0, ...data?.video_counts };
  const topVideos: any[] = (data?.top_videos ?? []).slice(0, 5);
  const bestHour = data?.best_posting_hour ?? null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Views"
          value={todayViews.toLocaleString()}
          sub="Across all videos"
        />
        <StatCard
          label="Watch Time"
          value={formatWatchTime(totalWatchSeconds)}
          sub="Total accumulated"
        />
        <StatCard
          label="Followers"
          value={followersTotal.toLocaleString()}
          sub={`+${followersNew} today`}
        />
        <StatCard
          label="Published"
          value={publishedCount.toLocaleString()}
          sub="Live videos"
        />
      </div>

      {/* ── Middle row: Watch Time + Retention Funnel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watch Time Breakdown */}
        <div
          className="lg:col-span-2 rounded-3xl p-6 border border-purple-900/40 shadow-xl relative overflow-hidden"
          style={{ backgroundColor: BRAND.panel }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-fuchsia-500" />
          <h3 className="text-lg font-bold text-white mb-6">Watch Time</h3>

          <div className="space-y-5">
            {/* Full Videos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Film size={14} style={{ color: BRAND.textMuted }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: BRAND.textMuted }}
                  >
                    Full Videos
                  </span>
                </div>
                <span className="text-sm font-bold text-white">
                  {fullVideoHours}h
                </span>
              </div>
              <div
                className="w-full h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((fullVideoHours / maxWatchHours) * 100, 100)}%`,
                    background:
                      "linear-gradient(135deg, #7E22CE, #a855f7)",
                  }}
                />
              </div>
            </div>

            {/* Shorts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Play size={14} style={{ color: BRAND.textMuted }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: BRAND.textMuted }}
                  >
                    Shorts
                  </span>
                </div>
                <span className="text-sm font-bold text-white">
                  {shortsHours}h
                </span>
              </div>
              <div
                className="w-full h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((shortsHours / maxWatchHours) * 100, 100)}%`,
                    background:
                      "linear-gradient(135deg, #c026d3, #e879f9)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Total summary */}
          <div
            className="mt-6 pt-4 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: BRAND.textMuted }}>
              Total
            </span>
            <span className="text-lg font-bold text-white">
              {formatWatchTime(totalWatchSeconds)}
            </span>
          </div>
        </div>

        {/* Retention Funnel */}
        <div
          className="lg:col-span-1 rounded-3xl p-6 border border-purple-900/40 shadow-xl relative overflow-hidden"
          style={{ backgroundColor: BRAND.panel }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400" />
          <h3 className="text-lg font-bold text-white mb-6">
            Retention Funnel
          </h3>

          {funnelStarted > 0 ? (
            <div className="space-y-3">
              {FUNNEL_STEPS.map((step, idx) => {
                const value = (funnel?.[step.key] as number) ?? 0;
                const pct = funnelStarted > 0 ? (value / funnelStarted) * 100 : 0;
                const opacity = 1 - idx * 0.15;

                return (
                  <div key={step.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-medium"
                        style={{ color: BRAND.textMuted }}
                      >
                        {step.label}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {value.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className="w-full h-2.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          background: `linear-gradient(135deg, rgba(126,34,206,${opacity}), rgba(192,38,211,${opacity}))`,
                        }}
                      />
                    </div>
                    <p
                      className="text-[10px] mt-0.5 text-right"
                      style={{ color: BRAND.textDim }}
                    >
                      {pct.toFixed(1)}%
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <TrendingUp size={28} style={{ color: BRAND.textDim }} />
              <p
                className="text-sm mt-3"
                style={{ color: BRAND.textMuted }}
              >
                No retention data yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom section: Top Videos + Quick Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Videos */}
        <div
          className="lg:col-span-2 rounded-3xl border border-purple-900/40 shadow-xl overflow-hidden flex flex-col"
          style={{ backgroundColor: BRAND.panel }}
        >
          <div className="p-6 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Top Videos</h3>
            <button
              onClick={() => onNavigate("my-videos")}
              className="flex items-center gap-1 text-xs font-semibold transition hover:opacity-80"
              style={{ color: BRAND.accent }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead>
                <tr style={{ backgroundColor: "rgba(59,8,102,0.4)" }}>
                  <th
                    className="px-6 py-3 text-xs uppercase tracking-wider font-semibold"
                    style={{ color: BRAND.textMuted }}
                  >
                    #
                  </th>
                  <th
                    className="px-6 py-3 text-xs uppercase tracking-wider font-semibold"
                    style={{ color: BRAND.textMuted }}
                  >
                    Title
                  </th>
                  <th
                    className="px-6 py-3 text-xs uppercase tracking-wider font-semibold text-right"
                    style={{ color: BRAND.textMuted }}
                  >
                    Views
                  </th>
                  <th
                    className="px-6 py-3 text-xs uppercase tracking-wider font-semibold text-right"
                    style={{ color: BRAND.textMuted }}
                  >
                    Likes
                  </th>
                </tr>
              </thead>
              <tbody>
                {topVideos.length > 0 ? (
                  topVideos.map((video: any, idx: number) => (
                    <tr
                      key={video.id ?? idx}
                      className="transition-colors hover:bg-black/20"
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <td
                        className="px-6 py-4 text-xs font-bold"
                        style={{ color: BRAND.textDim }}
                      >
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg, #7E22CE, #c026d3)",
                            }}
                          >
                            <Play size={12} className="text-white" />
                          </div>
                          <span
                            className="font-medium truncate max-w-[200px] lg:max-w-[300px]"
                            style={{ color: BRAND.textMain }}
                          >
                            {video.title || "Untitled"}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-right font-semibold"
                        style={{ color: BRAND.textMain }}
                      >
                        {(video.view_count ?? 0).toLocaleString()}
                      </td>
                      <td
                        className="px-6 py-4 text-right font-semibold"
                        style={{ color: BRAND.accent }}
                      >
                        {(video.like_count ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Film
                        size={28}
                        className="mx-auto mb-2"
                        style={{ color: BRAND.textDim }}
                      />
                      <p
                        className="text-sm"
                        style={{ color: BRAND.textMuted }}
                      >
                        No videos yet. Upload your first video to get started.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div
          className="lg:col-span-1 rounded-3xl p-6 border border-purple-900/40 shadow-xl relative overflow-hidden"
          style={{ backgroundColor: BRAND.panel }}
        >
          <h3 className="text-lg font-bold text-white mb-5">Quick Stats</h3>

          {/* Video counts breakdown */}
          <div className="space-y-3">
            {STATUS_DOTS.map((s) => {
              const count = (videoCounts[s.key] as number) ?? 0;
              return (
                <div
                  key={s.key}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: BRAND.textMuted }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{ color: BRAND.textMain }}
                  >
                    {count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div
            className="my-5"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          />

          {/* Best Posting Hour */}
          <div>
            <p
              className="text-xs uppercase tracking-wider font-semibold mb-2"
              style={{ color: BRAND.textMuted }}
            >
              Best Posting Hour
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #7E22CE, #c026d3)",
                }}
              >
                <Clock size={18} className="text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {formatHour(bestHour)}
                </p>
                {bestHour !== null && bestHour !== undefined && (
                  <p
                    className="text-[10px] uppercase tracking-wider font-semibold"
                    style={{ color: BRAND.textDim }}
                  >
                    Local time
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Unread notifications */}
          {(data?.unread_notifications ?? 0) > 0 && (
            <>
              <div
                className="my-5"
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              />
              <button
                onClick={() => onNavigate("notifications")}
                className="w-full flex items-center justify-between p-3 rounded-xl transition hover:bg-black/20"
                style={{ backgroundColor: "rgba(126,34,206,0.1)" }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: BRAND.textMuted }}
                >
                  Unread Notifications
                </span>
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: BRAND.error }}
                >
                  {data.unread_notifications}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onNavigate("upload-video")}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition shadow-lg hover:shadow-xl hover:brightness-110"
          style={{
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})`,
          }}
        >
          <Upload size={18} /> Upload Video
        </button>
        <button
          onClick={() => onNavigate("my-videos")}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition hover:bg-purple-900/20"
          style={{
            color: BRAND.primary,
            border: `1px solid ${BRAND.primary}`,
          }}
        >
          <Film size={18} /> View All Videos
        </button>
        <button
          onClick={() => onNavigate("video-analytics")}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition hover:bg-purple-900/20"
          style={{
            color: BRAND.primary,
            border: `1px solid ${BRAND.primary}`,
          }}
        >
          <BarChart3 size={18} /> View Analytics
        </button>
      </div>
    </div>
  );
}
