import axios, { type AxiosInstance, type AxiosError } from "axios";
import type { HoloraResponse, AdminLoginResponse, PaginatedResponse } from "./types/common";
import type { LoginResponse, RefreshResponse } from "./types/auth";

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  onTokenRefreshed?: (access: string, refresh: string) => void;
  onAuthFailed?: () => void;
}

export interface ApiClient {
  instance: AxiosInstance;

  // Auth
  adminLogin(email: string, password: string): Promise<AdminLoginResponse>;
  login(email: string, password: string): Promise<HoloraResponse<LoginResponse>>;
  logout(refreshToken: string): Promise<void>;
  refreshToken(refreshToken: string): Promise<HoloraResponse<RefreshResponse>>;

  // Generic helpers
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, data?: unknown): Promise<T>;
  put<T>(path: string, data?: unknown): Promise<T>;
  patch<T>(path: string, data?: unknown): Promise<T>;
  del<T>(path: string): Promise<T>;
  postFormData<T>(path: string, formData: FormData): Promise<T>;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const instance = axios.create({
    baseURL: config.baseUrl,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor: attach auth token
  instance.interceptors.request.use((req) => {
    const token = config.getAccessToken?.();
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  });

  // Response interceptor: auto-refresh on 401
  let refreshPromise: Promise<string> | null = null;

  instance.interceptors.response.use(
    (response) => {
      // Auto-unwrap api_response() envelope: { success, message, data: T } → T
      // This lets all views read response.data directly without manual unwrapping.
      const body = response.data;
      if (
        body &&
        typeof body === "object" &&
        "success" in body &&
        "data" in body &&
        body.success === true
      ) {
        response.data = body.data;
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as typeof error.config & { _retry?: boolean };
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        const refreshTokenValue = config.getRefreshToken?.();
        if (!refreshTokenValue) {
          config.onAuthFailed?.();
          return Promise.reject(error);
        }

        try {
          // Deduplicate concurrent refresh calls
          if (!refreshPromise) {
            refreshPromise = (async () => {
              const res = await axios.post(
                `${config.baseUrl}/auth/refresh/`,
                { refresh: refreshTokenValue }
              );
              const { access, refresh } = res.data.data;
              config.onTokenRefreshed?.(access, refresh);
              return access;
            })();
          }

          const newAccessToken = await refreshPromise;
          refreshPromise = null;

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(originalRequest);
        } catch {
          refreshPromise = null;
          config.onAuthFailed?.();
          return Promise.reject(error);
        }
      }
      return Promise.reject(error);
    }
  );

  function buildUrl(path: string, params?: Record<string, string>): string {
    if (!params) return path;
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value);
      }
    });
    const qs = searchParams.toString();
    return qs ? `${path}?${qs}` : path;
  }

  return {
    instance,

    async adminLogin(email: string, password: string) {
      const res = await instance.post<AdminLoginResponse>("/admin/login/", {
        email,
        password,
      });
      return res.data;
    },

    async login(email: string, password: string) {
      const res = await instance.post<HoloraResponse<LoginResponse>>(
        "/auth/login/",
        { email, password }
      );
      // The response interceptor already unwraps api_response() envelopes,
      // so res.data is the inner { user, tokens } directly.
      // Wrap it back in { data } to maintain the expected auth context contract.
      const inner = res.data as unknown;
      return { data: inner } as HoloraResponse<LoginResponse>;
    },

    async logout(refreshToken: string) {
      await instance.post("/auth/logout/", { refresh: refreshToken });
    },

    async refreshToken(refreshToken: string) {
      const res = await instance.post<HoloraResponse<RefreshResponse>>(
        "/auth/refresh/",
        { refresh: refreshToken }
      );
      return res.data;
    },

    async get<T>(path: string, params?: Record<string, string>) {
      const res = await instance.get<T>(buildUrl(path, params));
      return res.data;
    },

    async post<T>(path: string, data?: unknown) {
      const res = await instance.post<T>(path, data);
      return res.data;
    },

    async put<T>(path: string, data?: unknown) {
      const res = await instance.put<T>(path, data);
      return res.data;
    },

    async patch<T>(path: string, data?: unknown) {
      const res = await instance.patch<T>(path, data);
      return res.data;
    },

    async del<T>(path: string) {
      const res = await instance.delete<T>(path);
      return res.data;
    },

    async postFormData<T>(path: string, formData: FormData) {
      const res = await instance.post<T>(path, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
  };
}
