"use client";

import { BRAND } from "../theme";

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  sub?: string;
  className?: string;
}

export function StatCard({ label, value, sub, className = "" }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl p-5 border border-white/5 shadow-xl ${className}`}
      style={{ backgroundColor: BRAND.card }}
    >
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value ?? "—"}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}
