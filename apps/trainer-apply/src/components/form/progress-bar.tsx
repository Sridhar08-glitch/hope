"use client";

import { P, STEPS } from "../../lib/constants";

interface ProgressBarProps {
  step: number;
  isMobile: boolean;
}

export function ProgressBar({ step, isMobile }: ProgressBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: isMobile ? 28 : 48,
        position: "relative",
        padding: "0 8px",
      }}
    >
      {/* Background track */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 24,
          right: 24,
          height: 2,
          background: P.border,
          zIndex: 0,
        }}
      />
      {/* Active track */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 24,
          height: 2,
          background: P.yellow,
          zIndex: 0,
          transition: "width 0.4s ease",
          width: `calc(${((step - 1) / (STEPS.length - 1)) * 100}% - 48px)`,
        }}
      />

      {STEPS.map((s) => {
        const isActive = s.id === step;
        const isPast = s.id < step;
        return (
          <div
            key={s.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: isMobile ? 24 : 28,
                height: isMobile ? 24 : 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? 11 : 13,
                fontWeight: 700,
                transition: "all 0.3s ease",
                background: isActive || isPast ? P.yellow : P.surface,
                border: `2px solid ${isActive || isPast ? P.yellow : P.border}`,
                color: isActive || isPast ? "#150926" : P.textMuted,
              }}
            >
              {isPast ? "\u2713" : s.id}
            </div>
            {!isMobile && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: isActive ? P.yellow : P.textMuted,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontFamily: "Helvetica, Arial, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
