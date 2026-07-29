"use client";

import { useState } from "react";
import { P } from "../../lib/constants";

interface FTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function FTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: FTextareaProps) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value ?? ""}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: P.inputBg,
        border: `1px solid ${focused ? P.borderFocus : P.border}`,
        borderRadius: 12,
        padding: 16,
        color: P.text,
        fontSize: 15,
        outline: "none",
        boxSizing: "border-box",
        fontFamily: '"Figtree", sans-serif',
        transition: "all 0.3s ease",
        boxShadow: focused ? `0 0 0 3px ${P.yellowGlow}` : "none",
        resize: "vertical",
      }}
    />
  );
}
