"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@holora/auth";
import { BRAND, Spinner } from "@holora/ui";
import { DashboardShell } from "@/components/trainer-app";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Redirect to login if wrong role
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role !== "trainer") {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show fullscreen loader while checking session
  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-4" style={{ backgroundColor: BRAND.bg }}>
        <img src="/assets/logo.png" alt="Holora" className="w-16 h-16 object-contain" />
        <Spinner />
        <p className="text-sm" style={{ color: BRAND.textMuted }}>Loading your dashboard...</p>
      </div>
    );
  }

  // Not authenticated — show nothing while redirect happens
  if (!isAuthenticated || !user || user.role !== "trainer") {
    return (
      <div className="h-[100dvh] flex items-center justify-center" style={{ backgroundColor: BRAND.bg }}>
        <Spinner />
      </div>
    );
  }

  // Authenticated trainer — render the dashboard
  return <DashboardShell />;
}
