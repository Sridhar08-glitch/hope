"use client";

import { P } from "../../lib/constants";

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, required, error, hint, children }: FieldProps) {
  return (
    <div style={{ width: "100%", marginBottom: 24, position: "relative" }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 700,
          color: P.textMuted,
          marginBottom: hint ? 4 : 8,
          letterSpacing: "0.05em",
          fontFamily: "Helvetica, Arial, sans-serif",
          textTransform: "uppercase",
        }}
      >
        {label} {required && <span style={{ color: P.yellow }}>*</span>}
      </label>
      {hint && (
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 13,
            color: P.textDim,
            fontFamily: '"Figtree", sans-serif',
            lineHeight: 1.4,
          }}
        >
          {hint}
        </p>
      )}
      {children}
      {error && (
        <div
          style={{
            fontSize: 13,
            color: "#ef4444",
            marginTop: 8,
            fontWeight: 600,
            fontFamily: '"Figtree", sans-serif',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
