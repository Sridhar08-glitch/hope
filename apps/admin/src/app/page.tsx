"use client";

import { AuthProvider } from "@holora/auth";
import { AdminApp } from "@/components/admin-app";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/HoloraPerformance";

export default function Home() {
  return (
    <AuthProvider apiBaseUrl={API_URL} storagePrefix="holora_admin">
      <AdminApp />
    </AuthProvider>
  );
}
