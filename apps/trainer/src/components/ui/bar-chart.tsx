"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface BarChartProps {
  bookings?: any[];
}

export function BarChart({ bookings = [] }: BarChartProps) {
  // Calculate weekly activity from bookings data
  const calculateWeeklyData = () => {
    const today = new Date();
    const weekData = Array(7).fill(0);

    // Count bookings for last 7 days
    bookings.forEach((booking) => {
      try {
        const bookingDate = new Date(booking.booking_date);
        const dayDiff = Math.floor(
          (today.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (dayDiff >= 0 && dayDiff < 7) {
          weekData[6 - dayDiff]++;
        }
      } catch {
        // Skip invalid dates
      }
    });

    // Normalize to percentages (0-100)
    const max = Math.max(...weekData, 1);
    return weekData.map((val) => Math.round((val / max) * 100));
  };

  const data = calculateWeeklyData();

  return (
    <div className="h-full w-full flex items-end justify-between gap-2 sm:gap-4 relative pt-6 pb-2 min-h-[160px]">
      <div className="absolute inset-0 flex flex-col justify-between pt-6 pb-2 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full border-t border-slate-700/40 border-dashed h-0 flex items-center">
            <span className="text-[9px] text-slate-600 absolute -left-2 sm:-left-4">
              {100 - i * 25}
            </span>
          </div>
        ))}
      </div>
      {data.map((val, i) => (
        <div key={i} className="relative w-full max-w-[32px] h-full flex flex-col justify-end group z-10">
          <div
            className="relative w-full flex flex-col items-center justify-end transition-all duration-700 ease-out"
            style={{ height: `${val}%` }}
          >
            <div className="absolute -top-1.5 w-3 h-3 rounded-full bg-fuchsia-500 shadow-[0_0_12px_rgba(236,72,153,1)] z-20 transition-all duration-300 group-hover:scale-150 group-hover:bg-white group-hover:shadow-[0_0_20px_rgba(236,72,153,1)]" />
            <div className="w-full h-full bg-gradient-to-t from-fuchsia-600/20 to-fuchsia-500/80 rounded-t-md z-10 border-t border-fuchsia-400/50 group-hover:from-fuchsia-600/40 transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
}
