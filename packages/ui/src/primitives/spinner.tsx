"use client";

import { BRAND } from "../theme";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className = "" }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center h-40 ${className}`}>
      <div
        className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
        style={{
          borderColor: `${BRAND.accent} transparent transparent transparent`,
        }}
      />
    </div>
  );
}
