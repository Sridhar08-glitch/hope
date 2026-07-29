"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import type { LucideIcon } from "lucide-react";

/* ── Animation Variants ─────────────────────────── */

export const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35, ease } }),
};

/* ── Debounce Hook ──────────────────────────────── */

import { useState, useEffect } from "react";

export function useDebouncedValue(value: string, delay = 400): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Card border style ──────────────────────────── */

export const cardStyle = {
  backgroundColor: BRAND.surface,
  border: `1px solid rgba(126, 34, 206, 0.08)`,
};

export const subtleBorder = `1px solid rgba(126, 34, 206, 0.08)`;
export const faintBorder = `1px solid rgba(126, 34, 206, 0.05)`;

/* ── Page Header ────────────────────────────────── */

export function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: BRAND.textMain }}>{title}</h1>
        <p className="text-[12px] mt-0.5" style={{ color: BRAND.textDim }}>{subtitle}</p>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </motion.div>
  );
}

/* ── Tab Bar ────────────────────────────────────── */

export function TabBar<T extends string>({ tabs, active, onChange }: { tabs: { key: T; label: string; icon?: LucideIcon }[]; active: T; onChange: (key: T) => void }) {
  return (
    <div className="flex gap-0.5 overflow-x-auto p-0.5 rounded-lg" style={{ backgroundColor: BRAND.surface }}>
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition"
          style={{
            backgroundColor: active === key ? `${BRAND.primary}18` : "transparent",
            color: active === key ? BRAND.textMain : BRAND.textDim,
          }}
        >
          {Icon && <Icon size={12} />}
          {label}
        </button>
      ))}
    </div>
  );
}

/* ── Modal ──────────────────────────────────────── */

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`rounded-xl ${wide ? "w-full max-w-2xl" : "w-full max-w-md"} max-h-[85vh] flex flex-col overflow-hidden`}
        style={{ backgroundColor: BRAND.surface, border: subtleBorder }}
      >
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: subtleBorder }}>
          <h3 className="text-[14px] font-semibold" style={{ color: BRAND.textMain }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Close"><X size={16} style={{ color: BRAND.textMuted }} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </motion.div>
    </div>
  );
}

/* ── Confirm Dialog ─────────────────────────────── */

export function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel, confirmColor }: {
  message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; confirmColor?: string;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl p-5 w-full max-w-xs" style={{ backgroundColor: BRAND.surface, border: subtleBorder }}>
        <p className="text-[13px] mb-4" style={{ color: BRAND.textMain }}>{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-[12px]" style={{ color: BRAND.textMuted }}>Cancel</button>
          <button onClick={onConfirm} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ backgroundColor: confirmColor || BRAND.error, color: "#fff" }}>{confirmLabel || "Confirm"}</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Empty State ────────────────────────────────── */

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="text-center py-10 rounded-xl" style={cardStyle}>
      <Icon size={24} className="mx-auto mb-2" style={{ color: BRAND.textDim }} />
      <p className="text-[12px]" style={{ color: BRAND.textDim }}>{message}</p>
    </div>
  );
}

/* ── Data Table ─────────────────────────────────── */

export function DataTable({ cols, children }: { cols: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: subtleBorder }}>
      <table className="w-full text-[12px]">
        <thead>
          <tr style={{ backgroundColor: BRAND.surface }}>
            {cols.map(c => (
              <th key={c} className="text-left px-3 py-2.5 font-medium" style={{ color: BRAND.textDim }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TR({ children }: { children: React.ReactNode }) {
  return <tr className="transition hover:bg-white/[0.015]" style={{ borderTop: faintBorder }}>{children}</tr>;
}

export function TD({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className || ""}`} style={{ color: BRAND.textMain }}>{children}</td>;
}

/* ── Stat Card ──────────────────────────────────── */

export function StatCard({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="rounded-lg p-2.5 text-center" style={cardStyle}>
      <p className="text-[16px] font-bold" style={{ color: color || BRAND.textMain }}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider" style={{ color: BRAND.textDim }}>{label}</p>
    </div>
  );
}

/* ── Form Field ─────────────────────────────────── */

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>{label}</label>
      {children}
    </div>
  );
}

export const inputStyle = {
  backgroundColor: BRAND.input,
  color: BRAND.textMain,
};

/* ── Action Buttons ─────────────────────────────── */

export function PrimaryButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}>
      {children}
    </button>
  );
}

export function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-[12px] transition hover:bg-white/5" style={{ color: BRAND.textMuted }}>
      {children}
    </button>
  );
}

/* ── Pagination ─────────────────────────────────── */

import { ChevronLeft, ChevronRight } from "lucide-react";

export function SimplePagination({ prevUrl, nextUrl, onPrev, onNext, count }: {
  prevUrl: string | null; nextUrl: string | null; onPrev: () => void; onNext: () => void; count?: number;
}) {
  if (!prevUrl && !nextUrl) return null;
  return (
    <div className="flex items-center justify-between mt-3">
      {count !== undefined && <span className="text-[11px]" style={{ color: BRAND.textDim }}>{count} shown</span>}
      <div className="flex items-center gap-1 ml-auto">
        <button onClick={onPrev} disabled={!prevUrl} className="p-1.5 rounded-md transition disabled:opacity-30 hover:bg-white/5" aria-label="Previous"><ChevronLeft size={14} style={{ color: BRAND.textMuted }} /></button>
        <button onClick={onNext} disabled={!nextUrl} className="p-1.5 rounded-md transition disabled:opacity-30 hover:bg-white/5" aria-label="Next"><ChevronRight size={14} style={{ color: BRAND.textMuted }} /></button>
      </div>
    </div>
  );
}

/* ── Status Badge ───────────────────────────────── */

export function StatusBadge({ status, color }: { status: string; color?: string }) {
  const colors: Record<string, string> = {
    active: BRAND.success, approved: BRAND.success, published: BRAND.success, completed: BRAND.success,
    pending: BRAND.warning, under_review: BRAND.warning, processing: BRAND.info,
    rejected: BRAND.error, failed: BRAND.error, inactive: BRAND.error, banned: BRAND.error, cancelled: BRAND.error,
    archived: BRAND.textDim, draft: BRAND.textDim,
  };
  const c = color || colors[status] || BRAND.textDim;
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: c, backgroundColor: `${c}12` }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
