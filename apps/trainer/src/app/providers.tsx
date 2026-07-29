"use client";

import { AuthProvider } from "@holora/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/HoloraPerformance";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider apiBaseUrl={API_URL} storagePrefix="holora_trainer">
      {children}
    </AuthProvider>
  );
}
