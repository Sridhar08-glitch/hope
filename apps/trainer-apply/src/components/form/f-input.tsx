"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { P } from "../../lib/constants";

interface FInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
  icon?: LucideIcon;
}

export function FInput({
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
  icon: Icon,
}: FInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {Icon && (
        <span
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            color: focused ? P.yellow : P.textMuted,
            transition: "color 0.3s",
          }}
        >
          <Icon size={18} />
        </span>
      )}
      <input
        type={type}
        value={value ?? ""}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: P.inputBg,
          border: `1px solid ${focused ? P.borderFocus : P.border}`,
          borderRadius: 12,
          padding: `16px 16px 16px ${Icon ? 44 : 16}px`,
          color: P.text,
          fontSize: 15,
          outline: "none",
          boxSizing: "border-box",
          fontFamily: '"Figtree", sans-serif',
          transition: "all 0.3s ease",
          boxShadow: focused ? `0 0 0 3px ${P.yellowGlow}` : "none",
        }}
      />
    </div>
  );
}
