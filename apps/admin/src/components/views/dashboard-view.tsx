"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Users, UserCheck, Calendar, DollarSign, AlertTriangle,
  TrendingUp, Star, Clock, Video, BarChart3,
} from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";

/* ── Types ──────────────────────────────────────── */

interface ModStats {
  total_reports_pending?: number;
  total_bans_active?: number;
  total_mutes_active?: number;
  total_violations_today?: number;
  flagged_messages?: number;
  appeals_pending?: number;
}

interface EventStats {
  total?: number;
  pending?: number;
  approved?: number;
  rejected?: number;
}

interface TrainerStats {
  total_trainers?: number;
  active_trainers?: number;
  verified_trainers?: number;
  featured_trainers?: number;
  pending_applications?: number;
  total_bookings?: number;
  total_revenue?: number;
  top_trainers?: { id: number; name: string; rating: number; total_sessions: number; total_reviews: number }[];
}

interface BookingStats {
  total_bookings?: number;
  total_revenue?: number;
  pending_bookings?: number;
  completed_bookings?: number;
  cancelled_bookings?: number;
}

interface DashboardViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
  onSetPendingReports?: (n: number) => void;
}

/* ── Animations ─────────────────────────────────── */

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4, ease } }),
};

/* ── Chart Theme ────────────────────────────────── */

const chartColors = {
  approved: BRAND.success,
  pending: BRAND.warning,
  rejected: BRAND.error,
  purple: BRAND.primary,
  gold: BRAND.accent,
  blue: BRAND.info,
};

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-[11px] shadow-xl" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.15)` }}>
      {label && <p className="font-medium mb-1" style={{ color: BRAND.textMain }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
}

/* ── Sparkline Mini Chart ───────────────────────── */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ v }));
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace("#", "")})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Main Component ─────────────────────────────── */

export default function DashboardView({ api, showToast, onSetPendingReports }: DashboardViewProps) {
  const [mod, setMod] = useState<ModStats | null>(null);
  const [ev, setEv] = useState<EventStats | null>(null);
  const [tr, setTr] = useState<TrainerStats | null>(null);
  const [bk, setBk] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/admin/moderation/stats/"),
      api.get("/admin/events/stats/"),
      api.get("/admin/trainer-dashboard/stats/"),
      api.get("/admin/bookings/stats/"),
    ]).then(([m, e, t, b]) => {
      const modData = m.status === "fulfilled" ? (m.value as ModStats) : null;
      setMod(modData);
      setEv(e.status === "fulfilled" ? (e.value as EventStats) : null);
      setTr(t.status === "fulfilled" ? (t.value as TrainerStats) : null);
      setBk(b.status === "fulfilled" ? (b.value as BookingStats) : null);
      if (modData && onSetPendingReports) onSetPendingReports(modData.total_reports_pending ?? 0);
    }).catch(() => showToast("Failed to load dashboard", "error"))
      .finally(() => setLoading(false));
  }, [api, showToast, onSetPendingReports]);

  if (loading) return <DashboardSkeleton />;

  /* ── Derived chart data ─────────────────────── */

  const eventPieData = [
    { name: "Approved", value: ev?.approved ?? 0, color: chartColors.approved },
    { name: "Pending", value: ev?.pending ?? 0, color: chartColors.pending },
    { name: "Rejected", value: ev?.rejected ?? 0, color: chartColors.rejected },
  ].filter(d => d.value > 0);

  const moderationBarData = [
    { name: "Reports", value: mod?.total_reports_pending ?? 0, fill: BRAND.warning },
    { name: "Bans", value: mod?.total_bans_active ?? 0, fill: BRAND.error },
    { name: "Mutes", value: mod?.total_mutes_active ?? 0, fill: BRAND.info },
    { name: "Violations", value: mod?.total_violations_today ?? 0, fill: BRAND.error },
    { name: "Appeals", value: mod?.appeals_pending ?? 0, fill: BRAND.primary },
  ];

  const bookingBarData = [
    { name: "Pending", value: bk?.pending_bookings ?? 0, fill: BRAND.warning },
    { name: "Completed", value: bk?.completed_bookings ?? 0, fill: BRAND.success },
    { name: "Cancelled", value: bk?.cancelled_bookings ?? 0, fill: BRAND.error },
  ];

  // Sparkline dummy data (would be real trend data from API)
  const sparkData = {
    trainers: [3, 3, 4, 4, 5, 5, 5],
    revenue: [0, 0, 0, 10, 0, 0, 0],
    bookings: [0, 1, 0, 2, 0, 0, 0],
    users: [5, 8, 10, 12, 15, 17, 19],
  };

  const kpis = [
    { label: "Total Trainers", value: tr?.total_trainers ?? 0, icon: Users, color: BRAND.primary, spark: sparkData.trainers, sub: `${tr?.active_trainers ?? 0} active` },
    { label: "Revenue", value: `$${(bk?.total_revenue ?? tr?.total_revenue ?? 0).toLocaleString()}`, icon: DollarSign, color: BRAND.success, spark: sparkData.revenue, sub: "All time" },
    { label: "Total Bookings", value: bk?.total_bookings ?? 0, icon: Calendar, color: BRAND.info, spark: sparkData.bookings, sub: `${bk?.pending_bookings ?? 0} pending` },
    { label: "Pending Apps", value: tr?.pending_applications ?? 0, icon: Clock, color: BRAND.warning, spark: sparkData.users, sub: "Trainer applications" },
  ];

  return (
    <div className="space-y-5">
      {/* Title */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-xl font-semibold" style={{ color: BRAND.textMain }}>Dashboard</h1>
        <p className="text-[12px] mt-0.5" style={{ color: BRAND.textDim }}>Platform overview and key metrics</p>
      </motion.div>

      {/* ── KPI Cards with Sparklines ────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            custom={i + 1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="rounded-xl p-4 group"
            style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.08)` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${k.color}12` }}>
                <k.icon size={15} style={{ color: k.color }} />
              </div>
              <Sparkline data={k.spark} color={k.color} />
            </div>
            <p className="text-xl font-bold" style={{ color: BRAND.textMain }}>{k.value}</p>
            <p className="text-[11px]" style={{ color: BRAND.textDim }}>{k.label}</p>
            <p className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{k.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Event Pie Chart */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl p-4" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.08)` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold" style={{ color: BRAND.textMain }}>Event Breakdown</h3>
            <Calendar size={14} style={{ color: BRAND.accent }} />
          </div>
          {eventPieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={eventPieData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={3} strokeWidth={0}>
                      {eventPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {eventPieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px]" style={{ color: BRAND.textMuted }}>{d.name}</span>
                    </div>
                    <span className="text-[12px] font-bold" style={{ color: BRAND.textMain }}>{d.value}</span>
                  </div>
                ))}
                <div className="pt-1" style={{ borderTop: `1px solid rgba(126,34,206,0.06)` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: BRAND.textDim }}>Total</span>
                    <span className="text-[13px] font-bold" style={{ color: BRAND.accent }}>{ev?.total ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-28">
              <p className="text-[11px]" style={{ color: BRAND.textDim }}>No events yet</p>
            </div>
          )}
        </motion.div>

        {/* Moderation Bar Chart */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl p-4" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.08)` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold" style={{ color: BRAND.textMain }}>Moderation</h3>
            <AlertTriangle size={14} style={{ color: BRAND.warning }} />
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moderationBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: BRAND.textDim }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: BRAND.textDim }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20}>
                  {moderationBarData.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bookings Bar Chart */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl p-4" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.08)` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold" style={{ color: BRAND.textMain }}>Bookings</h3>
            <TrendingUp size={14} style={{ color: BRAND.success }} />
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: BRAND.textDim }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: BRAND.textDim }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                  {bookingBarData.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid rgba(126,34,206,0.06)` }}>
            <span className="text-[10px]" style={{ color: BRAND.textDim }}>Revenue</span>
            <span className="text-[14px] font-bold" style={{ color: BRAND.accent }}>${(bk?.total_revenue ?? 0).toLocaleString()}</span>
          </div>
        </motion.div>
      </div>

      {/* ── Top Trainers ───────────────────────── */}
      {tr?.top_trainers && tr.top_trainers.length > 0 && (
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl p-4" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.08)` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold" style={{ color: BRAND.textMain }}>Top Trainers</h3>
            <Star size={14} style={{ color: BRAND.accent }} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: `1px solid rgba(126,34,206,0.08)` }}>
                  <th className="text-left py-2 font-medium" style={{ color: BRAND.textDim }}>Trainer</th>
                  <th className="text-right py-2 font-medium" style={{ color: BRAND.textDim }}>Rating</th>
                  <th className="text-right py-2 font-medium" style={{ color: BRAND.textDim }}>Sessions</th>
                  <th className="text-right py-2 font-medium" style={{ color: BRAND.textDim }}>Reviews</th>
                </tr>
              </thead>
              <tbody>
                {tr.top_trainers.map((trainer, i) => (
                  <tr key={trainer.id} className="transition hover:bg-white/[0.02]" style={{ borderBottom: i < tr.top_trainers!.length - 1 ? `1px solid rgba(126,34,206,0.05)` : undefined }}>
                    <td className="py-2.5" style={{ color: BRAND.textMain }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${BRAND.accent}15`, color: BRAND.accent }}>
                          {trainer.name[0]}
                        </div>
                        {trainer.name}
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex items-center gap-1" style={{ color: BRAND.accent }}>
                        <Star size={10} fill={BRAND.accent} /> {trainer.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right" style={{ color: BRAND.textMuted }}>{trainer.total_sessions}</td>
                    <td className="py-2.5 text-right" style={{ color: BRAND.textMuted }}>{trainer.total_reviews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Quick Stats Footer ─────────────────── */}
      <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          ["Verified", tr?.verified_trainers ?? 0, UserCheck, BRAND.success],
          ["Featured", tr?.featured_trainers ?? 0, Star, BRAND.accent],
          ["Active", tr?.active_trainers ?? 0, Users, BRAND.info],
          ["Events", ev?.total ?? 0, Calendar, BRAND.warning],
        ] as const).map(([label, value, Icon, color]) => (
          <div key={label} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.08)` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}10` }}>
              <Icon size={14} style={{ color }} />
            </div>
            <div>
              <p className="text-[15px] font-bold leading-none" style={{ color: BRAND.textMain }}>{value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: BRAND.textDim }}>{label}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div><div className="h-5 w-24 rounded animate-pulse" style={{ backgroundColor: BRAND.panelLight + "30" }} /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.08)` }}>
            <div className="h-8 w-8 rounded-lg mb-3 animate-pulse" style={{ backgroundColor: BRAND.panelLight + "20" }} />
            <div className="h-6 w-12 rounded animate-pulse mb-1" style={{ backgroundColor: BRAND.panelLight + "30" }} />
            <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: BRAND.panelLight + "15" }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl p-4 h-48" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.08)` }}>
            <div className="h-4 w-24 rounded mb-4 animate-pulse" style={{ backgroundColor: BRAND.panelLight + "25" }} />
            <div className="h-28 w-full rounded animate-pulse" style={{ backgroundColor: BRAND.panelLight + "10" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
