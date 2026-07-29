"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from "react";
import { BRAND, Spinner, StatCard, Badge } from "@holora/ui";
import {
  BarChart3,
  Download,
  Eye,
  Clock,
  TrendingUp,
  ArrowLeft,
  Heart,
  MessageSquare,
  Bookmark,
  CheckCircle,
  Play,
  Calendar,
} from "lucide-react";
import { formatDate } from "@holora/utils";
import { FunnelChart } from "@/components/ui/funnel-chart";

/* ── types ── */

interface VideoAnalyticsViewProps {
  analyticsData: any[];
  loading: boolean;
  selectedVideoId: string | null;
  dailyData: any[];
  funnelData: any;
  bestPostingHour: number | null;
  onSelectVideo: (id: string | null) => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onExport: () => void;
  showToast: (message: string, type: "success" | "error") => void;
}

type SortField =
  | "title"
  | "view_count"
  | "like_count"
  | "comment_count"
  | "save_count"
  | "completion_count"
  | "average_watch_seconds";

type SortDirection = "asc" | "desc";

/* ── helpers ── */

function formatWatchTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";
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

function toHours(seconds: number): string {
  if (!seconds || seconds <= 0) return "0h";
  const h = Math.round((seconds / 3600) * 10) / 10;
  return `${h}h`;
}

/* ── funnel step labels ── */

const FUNNEL_LABELS: { key: string; label: string }[] = [
  { key: "started", label: "Started" },
  { key: "reached_5m", label: "5 min" },
  { key: "reached_10m", label: "10 min" },
  { key: "reached_20m", label: "20 min" },
  { key: "reached_half", label: "50%" },
];

/* ── sortable column definitions ── */

const COLUMNS: { key: SortField; label: string; align: string }[] = [
  { key: "title", label: "Video", align: "left" },
  { key: "view_count", label: "Views", align: "right" },
  { key: "like_count", label: "Likes", align: "right" },
  { key: "comment_count", label: "Comments", align: "right" },
  { key: "save_count", label: "Saves", align: "right" },
  { key: "completion_count", label: "Completions", align: "right" },
  { key: "average_watch_seconds", label: "Avg Watch", align: "right" },
];

/* ── component ── */

export function VideoAnalyticsView({
  analyticsData,
  loading,
  selectedVideoId,
  dailyData,
  funnelData,
  bestPostingHour,
  onSelectVideo,
  onDateRangeChange,
  onExport,
  showToast,
}: VideoAnalyticsViewProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortField, setSortField] = useState<SortField>("view_count");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  /* ── aggregate computations ── */

  const totalViews = useMemo(
    () =>
      (analyticsData ?? []).reduce(
        (sum: number, v: any) => sum + (v.view_count ?? 0),
        0
      ),
    [analyticsData]
  );

  const totalWatchTimeSeconds = useMemo(
    () =>
      (analyticsData ?? []).reduce(
        (sum: number, v: any) =>
          sum + (v.average_watch_seconds ?? 0) * (v.view_count ?? 0),
        0
      ),
    [analyticsData]
  );

  const avgCompletion = useMemo(() => {
    const videos = (analyticsData ?? []).filter(
      (v: any) => (v.view_count ?? 0) > 0
    );
    if (videos.length === 0) return 0;
    const total = videos.reduce(
      (sum: number, v: any) =>
        sum + ((v.completion_count ?? 0) / (v.view_count ?? 1)) * 100,
      0
    );
    return Math.round(total / videos.length);
  }, [analyticsData]);

  /* ── sorted data ── */

  const sortedData = useMemo(() => {
    const list = [...(analyticsData ?? [])];
    list.sort((a: any, b: any) => {
      const aRaw = a[sortField] ?? 0;
      const bRaw = b[sortField] ?? 0;
      if (typeof aRaw === "string" && typeof bRaw === "string") {
        return sortDir === "asc"
          ? aRaw.localeCompare(bRaw)
          : bRaw.localeCompare(aRaw);
      }
      const aVal = Number(aRaw ?? 0);
      const bVal = Number(bRaw ?? 0);
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [analyticsData, sortField, sortDir]);

  /* ── selected video data ── */

  const selectedVideo = useMemo(
    () =>
      selectedVideoId
        ? (analyticsData ?? []).find(
            (v: any) => v.video_id === selectedVideoId
          )
        : null,
    [analyticsData, selectedVideoId]
  );

  /* ── funnel steps for FunnelChart ── */

  const funnelSteps = useMemo(() => {
    if (!funnelData?.segment_funnel) return [];
    return FUNNEL_LABELS.map((s) => ({
      label: s.label,
      value: (funnelData.segment_funnel[s.key] as number) ?? 0,
    }));
  }, [funnelData]);

  /* ── date change handler ── */

  function handleDateChange(field: "start" | "end", value: string) {
    const newStart = field === "start" ? value : startDate;
    const newEnd = field === "end" ? value : endDate;

    if (field === "start") setStartDate(value);
    if (field === "end") setEndDate(value);

    if (newStart && newEnd) {
      onDateRangeChange(newStart, newEnd);
    }
  }

  /* ── sort toggle ── */

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  /* ── loading state ── */

  if (loading) return <Spinner />;

  /* ── detail mode ── */

  if (selectedVideoId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        {/* Header */}
        <div
          className="flex items-center gap-4 rounded-3xl p-4 md:p-6 border border-purple-900/40 shadow-lg"
          style={{ backgroundColor: BRAND.panel }}
        >
          <button
            onClick={() => onSelectVideo(null)}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition hover:bg-black/20"
            style={{ color: BRAND.textMain }}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold truncate" style={{ color: BRAND.textMain }}>
              {selectedVideo?.title ?? "Video Details"}
            </h2>
            {selectedVideo?.published_at && (
              <p className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>
                Published {formatDate(selectedVideo.published_at)}
              </p>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Views"
            value={(selectedVideo?.view_count ?? 0).toLocaleString()}
            sub="Total views"
          />
          <StatCard
            label="Likes"
            value={(selectedVideo?.like_count ?? 0).toLocaleString()}
            sub="Total likes"
          />
          <StatCard
            label="Comments"
            value={(selectedVideo?.comment_count ?? 0).toLocaleString()}
            sub="Total comments"
          />
          <StatCard
            label="Saves"
            value={(selectedVideo?.save_count ?? 0).toLocaleString()}
            sub="Total saves"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Views Chart */}
          <div
            className="lg:col-span-2 rounded-3xl p-6 border border-purple-900/40 shadow-xl relative overflow-hidden"
            style={{ backgroundColor: BRAND.panel }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-fuchsia-500" />
            <h3 className="text-lg font-bold mb-6" style={{ color: BRAND.textMain }}>
              Daily Views
            </h3>

            {dailyData && dailyData.length > 0 ? (
              <DailyViewsChart data={dailyData} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <BarChart3 size={32} style={{ color: BRAND.textDim }} />
                <p className="text-sm mt-3" style={{ color: BRAND.textMuted }}>
                  No daily data available
                </p>
              </div>
            )}
          </div>

          {/* Retention Funnel */}
          <div
            className="lg:col-span-1 rounded-3xl p-6 border border-purple-900/40 shadow-xl relative overflow-hidden"
            style={{ backgroundColor: BRAND.panel }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400" />
            <h3 className="text-lg font-bold mb-6" style={{ color: BRAND.textMain }}>
              Audience Retention
            </h3>

            {funnelSteps.length > 0 ? (
              <FunnelChart steps={funnelSteps} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <TrendingUp size={28} style={{ color: BRAND.textDim }} />
                <p className="text-sm mt-3" style={{ color: BRAND.textMuted }}>
                  No retention data yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Daily breakdown table */}
        {dailyData && dailyData.length > 0 && (
          <div
            className="rounded-3xl border border-purple-900/40 shadow-xl overflow-hidden"
            style={{ backgroundColor: BRAND.panel }}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold" style={{ color: BRAND.textMain }}>
                Daily Breakdown
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead>
                  <tr style={{ backgroundColor: "rgba(59,8,102,0.4)" }}>
                    <th
                      className="px-6 py-3 text-xs uppercase tracking-wider font-semibold"
                      style={{ color: BRAND.textMuted }}
                    >
                      Date
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
                      Watch Time
                    </th>
                    <th
                      className="px-6 py-3 text-xs uppercase tracking-wider font-semibold text-right"
                      style={{ color: BRAND.textMuted }}
                    >
                      Unique Viewers
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((day: any, idx: number) => (
                    <tr
                      key={day.date ?? idx}
                      className="transition-colors hover:bg-black/20"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <td className="px-6 py-4" style={{ color: BRAND.textMain }}>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} style={{ color: BRAND.textDim }} />
                          {day.date ? formatDate(day.date) : "N/A"}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-right font-semibold tabular-nums"
                        style={{ color: BRAND.textMain }}
                      >
                        {(day.views ?? 0).toLocaleString()}
                      </td>
                      <td
                        className="px-6 py-4 text-right font-semibold tabular-nums"
                        style={{ color: BRAND.textMain }}
                      >
                        {formatWatchTime(day.watch_time_seconds ?? 0)}
                      </td>
                      <td
                        className="px-6 py-4 text-right font-semibold tabular-nums"
                        style={{ color: BRAND.textMain }}
                      >
                        {(day.unique_viewers ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── overview mode ── */

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl p-4 md:p-6 border border-purple-900/40 shadow-lg"
        style={{ backgroundColor: BRAND.panel }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #7E22CE, #c026d3)" }}
          >
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold" style={{ color: BRAND.textMain }}>
              Video Analytics
            </h2>
            <p className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>
              Track performance across all your videos
            </p>
          </div>
        </div>
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-lg hover:shadow-xl hover:brightness-110"
          style={{
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})`,
            color: BRAND.textMain,
          }}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Date range selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} style={{ color: BRAND.textMuted }} />
          <span className="text-sm font-medium" style={{ color: BRAND.textMuted }}>
            Date Range:
          </span>
        </div>
        <input
          type="date"
          value={startDate}
          onChange={(e) => handleDateChange("start", e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/50 transition"
          style={{ backgroundColor: BRAND.input }}
        />
        <span className="text-sm self-center" style={{ color: BRAND.textDim }}>
          to
        </span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => handleDateChange("end", e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/50 transition"
          style={{ backgroundColor: BRAND.input }}
        />
      </div>

      {/* Aggregate stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Views"
          value={totalViews.toLocaleString()}
          sub="Across all videos"
        />
        <StatCard
          label="Total Watch Time"
          value={toHours(totalWatchTimeSeconds)}
          sub="Estimated hours"
        />
        <StatCard
          label="Avg Completion"
          value={`${avgCompletion}%`}
          sub="Completion rate"
        />
        <StatCard
          label="Best Posting Hour"
          value={formatHour(bestPostingHour)}
          sub={bestPostingHour !== null ? "Local time" : undefined}
        />
      </div>

      {/* Video analytics table */}
      <div
        className="rounded-3xl border border-purple-900/40 shadow-xl overflow-hidden"
        style={{ backgroundColor: BRAND.panel }}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold" style={{ color: BRAND.textMain }}>
            Video Performance
          </h3>
          <p className="text-xs mt-1" style={{ color: BRAND.textMuted }}>
            Click a row to view detailed analytics
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead>
              <tr style={{ backgroundColor: "rgba(59,8,102,0.4)" }}>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-3 text-xs uppercase tracking-wider font-semibold cursor-pointer select-none transition hover:opacity-80 ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                    style={{ color: BRAND.textMuted }}
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortField === col.key && (
                        <span className="text-[10px]" style={{ color: BRAND.accent }}>
                          {sortDir === "asc" ? "\u25B2" : "\u25BC"}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.length > 0 ? (
                sortedData.map((video: any, idx: number) => (
                  <tr
                    key={video.video_id ?? idx}
                    className="transition-colors hover:bg-black/20 cursor-pointer"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                    onClick={() => onSelectVideo(video.video_id)}
                  >
                    {/* Title */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "linear-gradient(135deg, #7E22CE, #c026d3)" }}
                        >
                          <Play size={12} className="text-white" />
                        </div>
                        <span
                          className="font-medium truncate max-w-[200px] lg:max-w-[280px]"
                          style={{ color: BRAND.textMain }}
                        >
                          {video.title || "Untitled"}
                        </span>
                      </div>
                    </td>
                    {/* Views */}
                    <td
                      className="px-6 py-4 text-right font-semibold tabular-nums"
                      style={{ color: BRAND.textMain }}
                    >
                      {(video.view_count ?? 0).toLocaleString()}
                    </td>
                    {/* Likes */}
                    <td
                      className="px-6 py-4 text-right font-semibold tabular-nums"
                      style={{ color: BRAND.accent }}
                    >
                      {(video.like_count ?? 0).toLocaleString()}
                    </td>
                    {/* Comments */}
                    <td
                      className="px-6 py-4 text-right font-semibold tabular-nums"
                      style={{ color: BRAND.textMain }}
                    >
                      {(video.comment_count ?? 0).toLocaleString()}
                    </td>
                    {/* Saves */}
                    <td
                      className="px-6 py-4 text-right font-semibold tabular-nums"
                      style={{ color: BRAND.textMain }}
                    >
                      {(video.save_count ?? 0).toLocaleString()}
                    </td>
                    {/* Completions */}
                    <td
                      className="px-6 py-4 text-right font-semibold tabular-nums"
                      style={{ color: BRAND.textMain }}
                    >
                      {(video.completion_count ?? 0).toLocaleString()}
                    </td>
                    {/* Avg Watch */}
                    <td
                      className="px-6 py-4 text-right font-semibold tabular-nums"
                      style={{ color: BRAND.textMain }}
                    >
                      {formatWatchTime(video.average_watch_seconds ?? 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <BarChart3
                      size={32}
                      className="mx-auto mb-3"
                      style={{ color: BRAND.textDim }}
                    />
                    <p className="text-sm" style={{ color: BRAND.textMuted }}>
                      No video analytics data available
                    </p>
                    <p className="text-xs mt-1" style={{ color: BRAND.textDim }}>
                      Upload and publish videos to see performance metrics
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── inline daily views area chart ── */

function DailyViewsChart({ data }: { data: any[] }) {
  if (!Array.isArray(data) || data.length === 0) return null;

  const values = data.map((d: any) => d.views ?? 0);
  const maxVal = Math.max(...values, 1);
  const count = values.length;

  // SVG dimensions
  const svgWidth = 100;
  const svgHeight = 60;
  const padTop = 5;
  const padBottom = 12;
  const chartHeight = svgHeight - padTop - padBottom;

  // Compute points
  const points = values.map((v, i) => {
    const x = count === 1 ? svgWidth / 2 : (i / (count - 1)) * svgWidth;
    const y = padTop + chartHeight - (v / maxVal) * chartHeight;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x},${svgHeight - padBottom} L ${points[0].x},${svgHeight - padBottom} Z`;

  // Show max ~6 date labels on x-axis
  const labelInterval = Math.max(1, Math.floor(count / 6));

  return (
    <div className="w-full relative overflow-hidden min-h-[220px]">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-8 pointer-events-none z-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full border-t border-slate-700/40 border-dashed h-0 flex items-center">
            <span className="text-[9px] absolute -left-1" style={{ color: BRAND.textDim }}>
              {Math.round(maxVal - (maxVal / 4) * i)}
            </span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`-2 -2 ${svgWidth + 4} ${svgHeight + 4}`}
        preserveAspectRatio="none"
        className="w-full h-full z-10 relative pt-2"
        style={{ minHeight: "200px" }}
      >
        <defs>
          <linearGradient id="dailyGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7E22CE" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7E22CE" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#dailyGradient)"
          className="transition-all duration-1000"
        />

        {/* Line stroke */}
        <path
          d={linePath}
          fill="none"
          stroke="#7E22CE"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(126,34,206,0.8))" }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.5"
            fill="#fff"
            className="drop-shadow-[0_0_6px_#7E22CE]"
          />
        ))}
      </svg>

      {/* X-axis date labels */}
      <div className="flex justify-between mt-1 px-1">
        {data.map((d: any, i: number) => {
          if (i % labelInterval !== 0 && i !== count - 1) return null;
          return (
            <span
              key={d.date ?? i}
              className="text-[9px] shrink-0"
              style={{ color: BRAND.textDim }}
            >
              {d.date ? formatDate(d.date) : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}
