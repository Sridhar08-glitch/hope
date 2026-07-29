"use client";

import { P } from "../../lib/constants";

interface ToggleCardProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  desc: string;
}

export function ToggleCard({ label, checked, onChange, desc }: ToggleCardProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderRadius: 16,
        cursor: "pointer",
        transition: "all 0.3s ease",
        gap: 16,
        background: checked ? "rgba(126, 34, 206, 0.15)" : P.inputBg,
        border: `1px solid ${checked ? P.purple : P.border}`,
      }}
    >
      <div>
        <div
          style={{
            color: checked ? P.yellow : P.text,
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "Helvetica, Arial, sans-serif",
            letterSpacing: "0.02em",
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            color: P.textMuted,
            fontSize: 14,
            fontFamily: "'Figtree', sans-serif",
            lineHeight: 1.4,
          }}
        >
          {desc}
        </div>
      </div>
      <div
        style={{
          width: 48,
          height: 26,
          borderRadius: 13,
          position: "relative",
          transition: "background 0.3s",
          flexShrink: 0,
          background: checked ? P.yellow : "rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: checked ? "#150926" : P.text,
            position: "absolute",
            top: 3,
            left: checked ? 25 : 3,
            transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ display: "none" }}
      />
    </label>
  );
}
