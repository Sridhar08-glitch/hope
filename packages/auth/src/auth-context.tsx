"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { createApiClient, type ApiClient } from "@holora/api-client";

export interface AuthState {
  user: {
    id: string | number;
    email: string;
    role: string;
    name?: string;
    is_staff?: boolean;
    is_superuser?: boolean;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  api: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthState | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  apiBaseUrl: string;
  storagePrefix?: string;
}

export function AuthProvider({
  children,
  apiBaseUrl,
  storagePrefix = "holora",
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshKey = `${storagePrefix}_refresh_token`;
  const userKey = `${storagePrefix}_user`;

  // Use a ref for the access token so the api-client closure always reads the latest value
  const accessTokenRef = useRef<string | null>(null);

  // Stable api client — created once, never recreated
  const api = useMemo(() => createApiClient({
    baseUrl: apiBaseUrl,
    getAccessToken: () => accessTokenRef.current,
    getRefreshToken: () => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(refreshKey);
    },
    onTokenRefreshed: (access, refresh) => {
      accessTokenRef.current = access;
      if (typeof window !== "undefined") {
        localStorage.setItem(refreshKey, refresh);
      }
    },
    onAuthFailed: () => {
      accessTokenRef.current = null;
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(refreshKey);
        localStorage.removeItem(userKey);
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [apiBaseUrl]);

  // Hydrate session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(userKey);
    const storedRefresh = localStorage.getItem(refreshKey);

    if (storedUser && storedRefresh) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);

        // Refresh access token silently
        api
          .refreshToken(storedRefresh)
          .then((res) => {
            // The api_response interceptor may unwrap the envelope,
            // so handle both wrapped and unwrapped shapes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = (res as any)?.data ?? res;
            const access = data?.access;
            const refresh = data?.refresh ?? storedRefresh;

            if (access) {
              accessTokenRef.current = access;
              localStorage.setItem(refreshKey, refresh);
            }
          })
          .catch(() => {
            // Refresh failed — session expired, clear everything
            accessTokenRef.current = null;
            setUser(null);
            localStorage.removeItem(refreshKey);
            localStorage.removeItem(userKey);
          })
          .finally(() => setIsLoading(false));
      } catch {
        // Corrupted stored user JSON
        localStorage.removeItem(userKey);
        localStorage.removeItem(refreshKey);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      const loginData = res?.data ?? res;
      const { user: userData, tokens } = loginData as {
        user: { id: string | number; email: string; role: string; name?: string };
        tokens: { access_token: string; refresh_token: string };
      };

      const userObj = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        name: userData.name,
      };

      accessTokenRef.current = tokens.access_token;
      setUser(userObj);
      localStorage.setItem(refreshKey, tokens.refresh_token);
      localStorage.setItem(userKey, JSON.stringify(userObj));
    },
    [api, refreshKey, userKey]
  );

  const adminLogin = useCallback(
    async (email: string, password: string) => {
      const res = await api.adminLogin(email, password);

      const userObj = {
        id: res.user.id,
        email: res.user.email,
        role: res.user.role,
        name: res.user.username,
        is_staff: res.user.is_staff,
        is_superuser: res.user.is_superuser,
      };

      accessTokenRef.current = res.access;
      setUser(userObj);
      localStorage.setItem(refreshKey, res.refresh);
      localStorage.setItem(userKey, JSON.stringify(userObj));
    },
    [api, refreshKey, userKey]
  );

  const logout = useCallback(() => {
    const refreshTokenValue = localStorage.getItem(refreshKey);
    if (refreshTokenValue) {
      api.logout(refreshTokenValue).catch(() => {});
    }

    accessTokenRef.current = null;
    setUser(null);
    localStorage.removeItem(refreshKey);
    localStorage.removeItem(userKey);
  }, [api, refreshKey, userKey]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        api,
        login,
        adminLogin,
        logout,
        getAccessToken: () => accessTokenRef.current,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
