import { useState, useEffect } from "react";
import { AlertTriangle, Ban, Calendar, UserCheck, Activity, CalendarDays, ArrowUpRight, MoreVertical, Clock, ShoppingCart, ActivitySquare, Ticket, Layers } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, Badge } from "../../components/ui";
import adminApi from "../../services/adminApi";

function DashboardView({ token, showToast }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      adminApi.moderation.stats(token),
      adminApi.events.stats(token),
      adminApi.trainers.dashboardStats(token),
      adminApi.bookings.stats(token),
    ]).then(([mod, ev, tr, bk]) => {
      setData({
        mod: mod.status === "fulfilled" ? mod.value : null,
        ev: ev.status === "fulfilled" ? ev.value : null,
        tr: tr.status === "fulfilled" ? tr.value : null,
        bk: bk.status === "fulfilled" ? bk.value : null,
      });
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner />;

  const pendingReports = data.mod?.total_reports_pending ?? 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const resolvedSimulated = 28;
  const totalSimulated = pendingReports + resolvedSimulated;
  const resolvedPct = totalSimulated > 0 ? Math.round((resolvedSimulated / totalSimulated) * 100) : 85;
  const dashLength = (resolvedPct / 100) * circumference;

  return (
    <div className="pb-8">
      <div className="grid grid-cols-12 gap-6">

        {/* Widget A — Hero (col-span-8) */}
        <div className="col-span-12 lg:col-span-8 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl border border-white/5 flex items-center"
          style={{ background: `linear-gradient(135deg, ${BRAND.panelLight}, ${BRAND.panel})` }}>
          <div className="z-10 relative w-full lg:w-2/3">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome to Holora Admin</h2>
            <p className="text-slate-300 mb-8 max-w-md">
              {(data.tr?.pending_applications ?? 0) > 0 || pendingReports > 0
                ? `${data.tr?.pending_applications ?? 0} pending trainer applications and ${pendingReports} unresolved community reports today.`
                : "Platform is running smoothly. All systems operational."}
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-lg text-white" style={{ backgroundColor: BRAND.primary }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{data.bk?.total_bookings ?? "—"}</p>
                  <p className="text-xs text-gray-300 uppercase tracking-wider">Total Bookings</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}>
                  <ArrowUpRight size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{data.bk?.total_revenue ? `$${data.bk.total_revenue}` : "—"}</p>
                  <p className="text-xs text-gray-300 uppercase tracking-wider">Revenue</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:flex items-center justify-center pointer-events-none opacity-80">
            <div className="w-48 h-48 rounded-full blur-3xl absolute opacity-30" style={{ background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.primary})` }}></div>
            <svg viewBox="0 0 200 200" className="w-40 h-40" style={{ animation: 'spin 20s linear infinite' }}>
              <defs>
                <linearGradient id="dashOrb" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={BRAND.accent} />
                  <stop offset="100%" stopColor={BRAND.primary} />
                </linearGradient>
              </defs>
              <path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.4,-46.3C91,-33.5,97.2,-18.1,98.6,-2.3C100,13.5,96.6,29.7,87.6,43.2C78.6,56.7,64,67.5,48.5,74.6C33,81.7,16.5,85.1,0.5,84.2C-15.5,83.3,-31,78.1,-45.2,70.3C-59.4,62.5,-72.3,52.1,-81.1,39.1C-89.9,26.1,-94.6,10.5,-93.8,-4.8C-93,-20.1,-86.7,-35.1,-76.8,-47.5C-66.9,-59.9,-53.4,-69.7,-39.1,-76.5C-24.8,-83.3,-9.7,-87.1,5.6,-96.5C18.6,-86.9,30.6,-83.6,44.7,-76.4Z" fill="url(#dashOrb)" transform="translate(100 100)" />
            </svg>
          </div>
        </div>

        {/* Widget B — Report Tracker (col-span-4) */}
        <div className="col-span-12 lg:col-span-4 rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col justify-between" style={{ backgroundColor: BRAND.panel }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Report Tracker</h3>
              <p className="text-xs text-gray-400">Last 7 Days</p>
            </div>
            <MoreVertical size={18} className="text-gray-400" />
          </div>
          <div className="flex items-center justify-between">
            <div className="w-1/2">
              <h2 className="text-4xl font-bold text-white mb-1">{pendingReports}</h2>
              <p className="text-xs text-gray-400 mb-6">Pending Reports</p>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 p-1.5 rounded-md text-red-400"><AlertTriangle size={16} /></div>
                  <div>
                    <p className="text-white font-medium">Active Bans</p>
                    <p className="text-xs text-gray-400">{data.mod?.total_bans_active ?? 0} bans</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/20 p-1.5 rounded-md text-orange-400"><Ban size={16} /></div>
                  <div>
                    <p className="text-white font-medium">Violations</p>
                    <p className="text-xs text-gray-400">{data.mod?.total_violations_today ?? 0} today</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500/20 p-1.5 rounded-md text-yellow-400"><Clock size={16} /></div>
                  <div>
                    <p className="text-white font-medium">Active Mutes</p>
                    <p className="text-xs text-gray-400">{data.mod?.total_mutes_active ?? 0} mutes</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-1/2 flex justify-end relative">
              <svg viewBox="0 0 100 100" className="w-36 h-36" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r={radius} fill="none" stroke={BRAND.panelLight} strokeWidth="12" strokeDasharray="4 6" />
                <circle cx="50" cy="50" r={radius} fill="none" stroke={BRAND.primary} strokeWidth="12"
                  style={{ strokeDasharray: `4 6 ${dashLength} ${circumference}` }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center ml-[20%]">
                <span className="text-2xl font-bold text-white">{resolvedPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Widget C — 4 Mini Stat Cards */}
        {[
          { title: "Total Events", value: data.ev?.total, icon: CalendarDays, color: BRAND.accent, change: null },
          { title: "Pending Applications", value: data.tr?.pending_applications, icon: Layers, color: BRAND.info, change: null },
          { title: "Active Trainers", value: data.tr?.active_trainers, icon: Activity, color: BRAND.success, isLive: true },
          { title: "Total Bookings", value: data.bk?.total_bookings, icon: Ticket, color: BRAND.primaryHover, change: null },
        ].map(({ title, value, icon: Icon, color, change, isLive }) => (
          <div key={title} style={{ backgroundColor: BRAND.panel }}
            className="col-span-12 md:col-span-6 lg:col-span-3 rounded-2xl p-6 border border-white/5 shadow-xl flex items-center justify-between group transition-all hover:border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle at right, ${color}, transparent)` }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium text-gray-400">{title}</p>
                {isLive && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-white mb-2">{value ?? "—"}</p>
              {change && <span className="text-xs font-bold px-2 py-1 rounded bg-white/5 text-green-400">{change}</span>}
              {isLive && <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/10 text-green-400">Live data</span>}
            </div>
            <div className="relative z-10 p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
              style={{ backgroundColor: `${color}20`, color }}>
              <Icon size={32} />
            </div>
          </div>
        ))}

        {/* Widget D — Revenue Overview */}
        <div style={{ backgroundColor: BRAND.panel }} className="col-span-12 md:col-span-6 xl:col-span-4 rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-white">Revenue Overview</h3>
              <span className="text-green-400 text-sm font-medium flex items-center"><ArrowUpRight size={16} className="mr-1" />Live</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">{data.bk?.total_revenue ? `$${data.bk.total_revenue}` : "—"}</h2>
          </div>
          <div className="h-24 w-full relative mb-4">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND.success} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={BRAND.success} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,40 Q15,30 30,35 T60,20 T80,25 T100,5 L100,40 Z" fill="url(#revGradient)" />
              <path d="M0,40 Q15,30 30,35 T60,20 T80,25 T100,5" fill="none" stroke={BRAND.success} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="w-5/12">
              <div className="flex items-center text-sm text-gray-400 mb-1"><ShoppingCart size={14} className="mr-2 text-blue-400" /> Bookings</div>
              <p className="text-white font-bold text-lg">{data.bk?.total_bookings ?? "—"}</p>
            </div>
            <div className="w-5/12 text-right">
              <div className="text-sm text-gray-400 mb-1">Trainers</div>
              <p className="text-white font-bold text-lg">{data.tr?.active_trainers ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Widget E — Trainer Insights Bar */}
        <div style={{ backgroundColor: BRAND.panel }} className="col-span-12 md:col-span-6 xl:col-span-4 rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Trainer Insights</h3>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-2xl font-bold text-white">{data.tr?.active_trainers ?? "—"}</p>
                <span className="text-green-400 text-sm font-medium flex items-center"><ArrowUpRight size={16} /> Active</span>
              </div>
            </div>
            <MoreVertical size={18} className="text-gray-400" />
          </div>
          <div className="h-32 w-full flex items-end justify-between px-2 mb-6">
            {[40, 60, 45, 80, 55, 70, 90, 50, 65].map((val, i) => (
              <div key={i} className="w-2 relative h-full flex flex-col justify-end items-center">
                <div className="w-full rounded-full z-10 transition-all duration-500"
                  style={{ backgroundColor: i % 2 === 0 ? BRAND.primary : BRAND.accent, height: `${val}%`, marginBottom: `${(100 - val) / 2}%` }}></div>
              </div>
            ))}
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 text-purple-400 p-1.5 rounded-lg"><UserCheck size={16} /></div>
                <div>
                  <p className="text-white font-medium">Verified Trainers</p>
                  <p className="text-xs text-gray-400">Active accounts</p>
                </div>
              </div>
              <span className="text-green-400 font-bold">{data.tr?.verified_trainers ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 text-blue-400 p-1.5 rounded-lg"><ActivitySquare size={16} /></div>
                <div>
                  <p className="text-white font-medium">Featured Trainers</p>
                  <p className="text-xs text-gray-400">Spotlight accounts</p>
                </div>
              </div>
              <span className="text-blue-400 font-bold">{data.tr?.featured_trainers ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Widget F — Event Breakdown */}
        <div style={{ backgroundColor: BRAND.panel }} className="col-span-12 xl:col-span-4 rounded-2xl p-6 border border-white/5 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Event Breakdown</h3>
              <p className="text-xs text-gray-400 mt-1">Approval status overview</p>
            </div>
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400"><Calendar size={18} /></div>
          </div>
          {data.ev ? (
            <div className="space-y-5">
              {[["Approved", data.ev.approved, BRAND.success, "green"], ["Pending", data.ev.pending, BRAND.warning, "yellow"], ["Rejected", data.ev.rejected, BRAND.error, "red"]].map(([l, v, hex, c]) => {
                const total = (data.ev.approved ?? 0) + (data.ev.pending ?? 0) + (data.ev.rejected ?? 0);
                const pct = total > 0 ? Math.round(((v ?? 0) / total) * 100) : 0;
                return (
                  <div key={l}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white font-medium">{l}</span>
                      <Badge color={c}>{v ?? 0}</Badge>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: hex }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-slate-500 text-sm">No data available</p>}
        </div>

        {/* Widget G — Trainer Applications Overview */}
        <div style={{ backgroundColor: BRAND.panel }} className="col-span-12 xl:col-span-6 rounded-2xl p-6 border border-white/5 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Trainer Applications</h3>
              <p className="text-xs text-gray-400 mt-1">Review and approval pipeline</p>
            </div>
            <MoreVertical size={18} className="text-gray-400" />
          </div>
          {data.tr ? (
            <div className="space-y-5">
              {[
                ["Verified Trainers", data.tr.verified_trainers, "green", BRAND.success],
                ["Featured Trainers", data.tr.featured_trainers, "purple", BRAND.primary],
                ["Pending Applications", data.tr.pending_applications, "yellow", BRAND.warning],
              ].map(([l, v, c, hex]) => {
                const total = (data.tr.verified_trainers ?? 0) + (data.tr.pending_applications ?? 0) + 1;
                const pct = Math.min(Math.round(((v ?? 0) / total) * 100), 100);
                return (
                  <div key={l}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white font-medium">{l}</span>
                      <Badge color={c}>{v ?? 0}</Badge>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: hex }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-slate-500 text-sm">No data available</p>}
        </div>

        {/* Widget H — Platform Summary Timeline */}
        <div style={{ backgroundColor: BRAND.panel }} className="col-span-12 xl:col-span-6 rounded-2xl p-6 border border-white/5 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Platform Summary</h3>
              <p className="text-xs text-gray-400 mt-1">Key metrics at a glance</p>
            </div>
            <MoreVertical size={18} className="text-gray-400" />
          </div>
          <div className="relative border-l border-white/10 ml-3 space-y-6 pb-2">
            {[
              { title: `${data.ev?.total ?? 0} Total Events`, detail: `${data.ev?.approved ?? 0} approved`, dot: 'bg-green-500', color: 'text-green-400', time: `${data.ev?.pending ?? 0} pending` },
              { title: `${data.tr?.pending_applications ?? 0} Trainer Applications`, detail: 'Awaiting review', dot: 'bg-yellow-500', color: 'text-yellow-400', time: 'Pending' },
              { title: `${pendingReports} Open Reports`, detail: 'Awaiting moderation', dot: 'bg-red-500', color: 'text-red-400', time: `${data.mod?.total_bans_active ?? 0} bans` },
              { title: `${data.tr?.verified_trainers ?? 0} Verified Trainers`, detail: 'Active on platform', dot: 'bg-purple-500', color: 'text-purple-400', time: 'Live' },
            ].map((item, idx) => (
              <div key={idx} className="relative pl-6">
                <span className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ${item.dot} ring-4`} style={{ ringColor: BRAND.panel }}></span>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium text-sm">{item.title}</p>
                    <p className={`text-xs mt-0.5 ${item.color}`}>{item.detail}</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-white/5 text-xs font-bold text-gray-300 border border-white/5">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardView;
