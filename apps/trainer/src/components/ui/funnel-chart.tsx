"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { BRAND } from "@holora/ui";

interface FunnelStep {
  label: string;
  value: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  className?: string;
}

export function FunnelChart({ steps, className = "" }: FunnelChartProps) {
  const maxValue = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className={`space-y-3 ${className}`}>
      {steps.map((step, idx) => {
        const widthPct = (step.value / maxValue) * 100;
        const opacity = 1 - idx * 0.15;

        return (
          <div key={step.label} className="flex items-center gap-3">
            {/* Label */}
            <span
              className="text-sm shrink-0 w-20 text-right"
              style={{ color: BRAND.textMuted }}
            >
              {step.label}
            </span>

            {/* Bar container */}
            <div className="flex-1 relative">
              <div
                className="h-7 rounded-lg transition-all duration-700"
                style={{
                  width: `${Math.max(widthPct, 2)}%`,
                  minWidth: "8px",
                  background: `linear-gradient(135deg, rgba(126, 34, 206, ${opacity}), rgba(88, 28, 135, ${opacity}))`,
                }}
              />
            </div>

            {/* Value */}
            <span
              className="text-sm font-semibold shrink-0 w-16 text-right tabular-nums"
              style={{ color: BRAND.textMain }}
            >
              {step.value.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
