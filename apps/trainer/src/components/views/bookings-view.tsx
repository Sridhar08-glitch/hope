"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { CalendarDays, Clock, CreditCard, XCircle, CheckCircle2 } from "lucide-react";
import { Spinner } from "@holora/ui";

interface BookingsViewProps {
  bookings: any[];
  loading: boolean;
  bookingFilter: string;
  pendingCount: number;
  onFilterChange: (filter: string) => void;
  onAcceptBooking: (id: string | number) => void;
  onRejectBooking: (id: string | number) => void;
}

export function BookingsView({
  bookings,
  loading,
  bookingFilter,
  pendingCount,
  onFilterChange,
  onAcceptBooking,
  onRejectBooking,
}: BookingsViewProps) {
  const filteredBookings = (bookings || []).filter((b) => {
    if (bookingFilter === "history")
      return !["pending", "confirmed"].includes(b?.status);
    return b?.status === bookingFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
        <h2 className="text-xl font-bold text-white px-2">Bookings</h2>
        <div className="flex bg-purple-900/40 p-1 rounded-2xl border border-slate-800">
          {["pending", "confirmed", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => onFilterChange(tab)}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                bookingFilter === tab
                  ? "bg-purple-600 text-slate-900 shadow-[0_0_15px_rgba(126,34,206,0.5)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab} {tab === "pending" && pendingCount > 0 && `(${pendingCount})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all"
            >
              {booking.status === "pending" && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400" />
              )}
              {booking.status === "confirmed" && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-purple-400" />
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg ${
                      booking.status === "pending"
                        ? "bg-gradient-to-br from-fuchsia-600 to-pink-600 shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                        : "bg-gradient-to-br from-purple-600 to-purple-700 shadow-[0_0_15px_rgba(126,34,206,0.4)]"
                    }`}
                  >
                    {booking.client_name
                      ?.split(" ")
                      .map((n: string, i: number) => (i < 2 ? n[0] : ""))
                      .join("") || "C"}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white leading-tight">
                      {booking.client_name || "Unknown"}
                    </h4>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                      {booking.session_type || "session"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-purple-900/40/50 p-4 rounded-2xl border border-purple-900/40 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2">
                    <CalendarDays size={14} /> Date
                  </span>
                  <span className="text-slate-200 font-medium">{booking.booking_date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Clock size={14} /> Time
                  </span>
                  <span className="text-slate-200 font-medium">
                    {booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2">
                    <CreditCard size={14} /> Price
                  </span>
                  <span className="text-yellow-400 font-bold">QAR {booking.total_amount}</span>
                </div>
              </div>

              {booking.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => onAcceptBooking(booking.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 px-4 py-3 rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(126,34,206,0.4)] hover:shadow-[0_0_20px_rgba(126,34,206,0.6)]"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onRejectBooking(booking.id)}
                    className="flex items-center justify-center px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              )}

              {booking.status === "confirmed" && (
                <div className="w-full flex items-center justify-center gap-2 bg-purple-600/10 text-yellow-400 border border-cyan-500/20 py-3 rounded-xl font-semibold">
                  <CheckCircle2 size={18} /> Confirmed
                </div>
              )}

              {["completed", "rejected", "cancelled"].includes(booking.status) && (
                <div className="w-full flex items-center justify-center py-3 rounded-xl font-semibold bg-slate-800 text-slate-400 capitalize">
                  {booking.status}
                </div>
              )}
            </div>
          ))}
          {filteredBookings.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays size={24} className="text-slate-600" />
              </div>
              <p>No bookings found in this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
