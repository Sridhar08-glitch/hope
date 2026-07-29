/** Standard backend response envelope */
export interface HoloraResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Admin login response (flat structure, different from standard) */
export interface AdminLoginResponse {
  message: string;
  access: string;
  refresh: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    is_staff: boolean;
    is_superuser: boolean;
  };
}

/** Paginated response from DRF */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** API error shape */
export interface ApiError {
  status: number;
  message: string;
  data?: Record<string, unknown>;
}
