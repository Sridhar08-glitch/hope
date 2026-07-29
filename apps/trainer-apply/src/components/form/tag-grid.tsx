"use client";

import { P } from "../../lib/constants";

interface TagGridProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function TagGrid({ options, selected, onToggle }: TagGridProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: active
                ? `1px solid ${P.yellow}`
                : `1px solid ${P.border}`,
              background: active ? P.yellowGlow : P.inputBg,
              color: active ? P.yellow : P.text,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "'Figtree', sans-serif",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
