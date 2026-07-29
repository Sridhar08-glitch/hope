"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Users, Star, Smartphone, CheckCircle2 } from "lucide-react";
import { Spinner } from "@holora/ui";
import { BarChart } from "@/components/ui/bar-chart";
import { AreaChart } from "@/components/ui/area-chart";
import { CircularProgress } from "@/components/ui/circular-progress";

interface DashboardViewProps {
  stats: any;
  profile: any;
  bookings: any[];
  payments: any[];
  loading: boolean;
  pendingCount: number;
  onAcceptBooking: (id: string | number) => void;
  onRejectBooking: (id: string | number) => void;
  onNavigate: (tab: string) => void;
}

export function DashboardView({
  stats,
  profile,
  bookings,
  payments,
  loading,
  pendingCount,
  onAcceptBooking,
  onRejectBooking,
  onNavigate,
}: DashboardViewProps) {
  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
        <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[280px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400" />
          <h3 className="text-slate-300 font-semibold mb-2 text-sm tracking-wide uppercase shrink-0">Weekly Activity</h3>
          <div className="flex-1 w-full pl-2 sm:pl-4">
            <BarChart bookings={bookings} />
          </div>
        </div>

        <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[280px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-purple-400" />
          <h3 className="text-slate-300 font-semibold mb-2 text-sm tracking-wide uppercase shrink-0">Performance Metrics</h3>
          <div className="flex-1 w-full grid grid-cols-2 gap-4 items-center h-full">
            <CircularProgress percentage={stats.retention_rate ?? 0} color="#7E22CE" title="Retention" subtitle="Last 30 days" />
            <CircularProgress percentage={stats.completion_rate ?? 0} color="#ec4899" title="Completion" subtitle="Overall avg" />
          </div>
        </div>

        <div className="md:col-span-2 2xl:col-span-1 grid grid-cols-2 gap-4 min-h-[280px]">
          <div
            className="bg-[#281247] border border-purple-900/40 rounded-3xl p-5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.02),_0_8px_16px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center cursor-pointer hover:bg-[#1a2035] transition group"
            onClick={() => onNavigate("bookings")}
          >
            <div className="w-14 h-14 rounded-full bg-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5),inset_0_2px_2px_rgba(255,255,255,0.05)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Smartphone className="text-yellow-400 drop-shadow-[0_0_5px_rgba(126,34,206,0.8)]" />
            </div>
            <span className="text-3xl font-black text-white mb-1">{pendingCount}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Pending Req</span>
          </div>

          <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.02),_0_8px_16px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center group">
            <div className="w-14 h-14 rounded-full bg-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5),inset_0_2px_2px_rgba(255,255,255,0.05)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Star className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
            </div>
            <span className="text-3xl font-black text-white mb-1">{stats.rating || profile.rating || "\u2014"}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Avg Rating</span>
          </div>

          <div className="col-span-2 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <h4 className="text-white font-bold text-lg">Total Clients</h4>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Users size={12} /> Active Members</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 drop-shadow-[0_0_10px_rgba(126,34,206,0.5)]">
                {stats.total_clients || 0}
              </span>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Clients</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-2 z-20 relative shrink-0">
            <h3 className="text-slate-300 font-semibold text-sm tracking-wide uppercase">Revenue Growth</h3>
            <span className="text-xs font-bold bg-slate-800/80 px-4 py-1.5 rounded-full text-slate-300 border border-slate-700">This Year</span>
          </div>
          <div className="flex-1 w-full mt-4 pl-1 sm:pl-4">
            <AreaChart payments={payments} />
          </div>
        </div>

        <div className="lg:col-span-1 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl overflow-hidden flex flex-col min-h-[400px] max-h-[500px] lg:max-h-[400px]">
          <h3 className="text-slate-300 font-semibold mb-6 text-sm tracking-wide uppercase flex justify-between items-center shrink-0">
            Pending Actions
            {pendingCount > 0 && (
              <span className="w-6 h-6 bg-fuchsia-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-[0_0_8px_rgba(236,72,153,0.8)]">
                {pendingCount}
              </span>
            )}
          </h3>

          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {(bookings || [])
              .filter((b) => b.status === "pending")
              .slice(0, 3)
              .map((booking) => (
                <div
                  key={booking.id}
                  className="bg-purple-900/40 rounded-2xl p-4 border border-slate-800 hover:border-purple-500/30 transition-all duration-300 group shrink-0"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(126,34,206,0.4)]">
                        {booking.client_name?.[0] || "C"}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{booking.client_name || "Unknown Client"}</h4>
                        <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                          {booking.booking_date} &bull; {booking.start_time?.substring(0, 5)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAcceptBooking(booking.id)}
                      className="flex-1 bg-purple-600/10 hover:bg-purple-600/20 border border-cyan-500/30 text-yellow-400 py-2 rounded-xl text-xs font-bold transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onRejectBooking(booking.id)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold transition border border-slate-700/50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            {pendingCount === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm h-full flex flex-col items-center justify-center">
                <CheckCircle2 size={32} className="text-slate-600 mb-3" />
                <p>You&apos;re all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
