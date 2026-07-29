"use client";

import { useState, useEffect } from "react";

/**
 * Reads a JWT token from the URL query param `?token=<JWT>`.
 * Removes the token from the URL via history.replaceState for security.
 * Stores the token in memory only (never localStorage).
 *
 * Used by trainer-apply and event-apply apps which are opened from the Flutter app.
 */
export function useTokenFromUrl(): {
  token: string | null;
  isReady: boolean;
} {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      setToken(urlToken);

      // Remove token from URL for security (prevent it staying in browser history)
      params.delete("token");
      const newUrl =
        params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    setIsReady(true);
  }, []);

  return { token, isReady };
}
