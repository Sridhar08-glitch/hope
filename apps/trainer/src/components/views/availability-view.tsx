"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Plus, XCircle } from "lucide-react";
import { Spinner } from "@holora/ui";

interface AvailabilityViewProps {
  availability: any[];
  blockedDates: any[];
  loading: boolean;
  isAddingSlot: boolean;
  newSlot: { day: string; start_time: string; end_time: string };
  onToggleAddSlot: () => void;
  onNewSlotChange: (slot: { day: string; start_time: string; end_time: string }) => void;
  onAddSlot: (e: React.FormEvent) => void;
  onDeleteSlot: (slotId: string | number) => void;
  onBlockDate: () => void;
  onUnblockDate: (id: string | number) => void;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export function AvailabilityView({
  availability,
  blockedDates,
  loading,
  isAddingSlot,
  newSlot,
  onToggleAddSlot,
  onNewSlotChange,
  onAddSlot,
  onDeleteSlot,
  onBlockDate,
  onUnblockDate,
}: AvailabilityViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white px-2">Manage Schedule</h2>
          <p className="text-xs text-slate-500 px-2 mt-1">Set your weekly recurring hours.</p>
        </div>
        <button
          onClick={onToggleAddSlot}
          className="flex items-center justify-center gap-2 bg-fuchsia-500 hover:bg-fuchsia-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(236,72,153,0.5)]"
        >
          {isAddingSlot ? <XCircle size={18} /> : <Plus size={18} />}
          {isAddingSlot ? "Cancel" : "Add Slot"}
        </button>
      </div>

      {isAddingSlot && (
        <form
          onSubmit={onAddSlot}
          className="bg-[#281247] border border-fuchsia-500/30 rounded-3xl p-6 shadow-[0_0_20px_rgba(236,72,153,0.1)] mb-6 animate-in slide-in-from-top-4"
        >
          <h3 className="text-white font-bold mb-4">Create New Slot</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Day of Week</label>
              <select
                value={newSlot.day}
                onChange={(e) => onNewSlotChange({ ...newSlot, day: e.target.value })}
                className="w-full bg-purple-900/40 border border-slate-700 text-white p-3 rounded-xl focus:border-fuchsia-500 focus:outline-none"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d} className="capitalize">
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start Time</label>
              <input
                type="time"
                value={newSlot.start_time}
                onChange={(e) => onNewSlotChange({ ...newSlot, start_time: e.target.value })}
                className="w-full bg-purple-900/40 border border-slate-700 text-white p-3 rounded-xl focus:border-fuchsia-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">End Time</label>
              <input
                type="time"
                value={newSlot.end_time}
                onChange={(e) => onNewSlotChange({ ...newSlot, end_time: e.target.value })}
                className="w-full bg-purple-900/40 border border-slate-700 text-white p-3 rounded-xl focus:border-fuchsia-500 focus:outline-none"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.4)]"
          >
            Save Slot
          </button>
        </form>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {DAYS.map((day) => {
            const daySlots = availability.filter((s) => s.day === day);
            if (daySlots.length === 0) return null;

            return (
              <div
                key={day}
                className="bg-[#281247] border border-purple-900/40 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="w-32">
                  <h4 className="text-white font-bold capitalize text-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(126,34,206,0.8)]" />
                    {day}
                  </h4>
                </div>
                <div className="flex-1 flex flex-wrap gap-3">
                  {daySlots.map((slot: any) => (
                    <div
                      key={slot.id}
                      className="bg-purple-900/40 border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3 group hover:border-fuchsia-500/50 transition"
                    >
                      <span className="text-slate-300 font-medium text-sm">
                        {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                      </span>
                      <button
                        onClick={() => onDeleteSlot(slot.id)}
                        className="text-slate-600 hover:text-fuchsia-500 transition"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Blocked Dates Section */}
      <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">Blocked Dates</h3>
            <p className="text-xs text-slate-500 mt-1">Days you&apos;re unavailable for bookings.</p>
          </div>
          <button
            onClick={onBlockDate}
            className="flex items-center gap-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-2 rounded-xl text-sm font-bold transition"
          >
            <Plus size={16} /> Block Date
          </button>
        </div>
        {blockedDates.length === 0 ? (
          <p className="text-center py-4 text-slate-500 text-sm">No blocked dates</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {blockedDates.map((bd: any) => (
              <div
                key={bd.id}
                className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2 flex items-center gap-3 group"
              >
                <span className="text-red-400 font-medium text-sm">{bd.date}</span>
                {bd.reason && <span className="text-xs text-slate-500">({bd.reason})</span>}
                <button
                  onClick={() => onUnblockDate(bd.id)}
                  className="text-slate-600 hover:text-red-400 transition"
                >
                  <XCircle size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
