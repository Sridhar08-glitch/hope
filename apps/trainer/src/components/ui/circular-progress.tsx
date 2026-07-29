"use client";

interface CircularProgressProps {
  percentage: number;
  color: string;
  title: string;
  subtitle: string;
}

export function CircularProgress({ percentage, color, title, subtitle }: CircularProgressProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2 w-full">
      <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke="#1e293b" strokeWidth="8" fill="none" />
          <circle
            cx="50" cy="50" r={radius}
            stroke={color} strokeWidth="8" fill="none"
            strokeLinecap="round"
            style={{ strokeDasharray: circumference, strokeDashoffset, filter: `drop-shadow(0 0 8px ${color}80)` }}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-lg md:text-xl font-black text-white">{percentage}%</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs md:text-sm font-bold text-slate-200">{title}</p>
        <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{subtitle}</p>
      </div>
    </div>
  );
}
