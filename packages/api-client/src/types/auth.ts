/** User object from standard login */
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  provider: string;
  onboarding_completed: boolean;
  role: string;
  preferred_language: string;
  country_code: string;
  email_verified: boolean;
}

/** Standard login response: POST /auth/login/ */
export interface LoginResponse {
  user: AuthUser;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
  streak_days: number;
  longest_streak: number;
}

/** Token refresh response: POST /auth/refresh/ */
export interface RefreshResponse {
  access: string;
  refresh: string;
}
