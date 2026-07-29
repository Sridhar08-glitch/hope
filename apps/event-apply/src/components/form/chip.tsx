"use client";

import { P } from "../../lib/constants";

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "12px 20px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 14,
        transition: "all 0.2s",
        cursor: "pointer",
        flex: 1,
        border: active ? `1px solid ${P.yellow}` : `1px solid ${P.border}`,
        background: active ? P.yellowGlow : P.inputBg,
        color: active ? P.yellow : P.textMuted,
        fontFamily: '"Figtree", sans-serif',
      }}
    >
      {children}
    </button>
  );
}
