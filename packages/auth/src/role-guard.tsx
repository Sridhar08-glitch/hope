"use client";

import { useEffect, type ReactNode } from "react";
import { useAuth } from "./auth-context";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  /** URL to redirect to if not authenticated */
  loginPath?: string;
  /** Component to show while loading */
  fallback?: ReactNode;
  /** Component to show if role is not allowed */
  unauthorized?: ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
  loginPath = "/login",
  fallback = null,
  unauthorized = null,
}: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = loginPath;
    }
  }, [isLoading, isAuthenticated, loginPath]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!allowedRoles.includes(user?.role ?? "")) {
    return (
      <>
        {unauthorized ?? (
          <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>
            You do not have permission to access this page.
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
