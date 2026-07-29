import type { Config } from "tailwindcss";

const config: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#150926",
          surface: "#1D0E35",
          panel: "#281247",
          "panel-light": "#3b0866",
          primary: "#7E22CE",
          "primary-hover": "#8b3dde",
          accent: "#F4BE69",
          "accent-glow": "rgba(244, 190, 105, 0.2)",
          border: "rgba(126, 34, 206, 0.25)",
          "border-focus": "#F4BE69",
          "text-main": "#F8FAFC",
          "text-muted": "#cbd5e1",
          "text-dim": "rgba(247, 247, 247, 0.3)",
          input: "#110720",
          success: "#10b981",
          error: "#ef4444",
          warning: "#f59e0b",
          info: "#3b82f6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      padding: {
        safe: "max(1rem, env(safe-area-inset-bottom))",
      },
    },
  },
};

export default config;
