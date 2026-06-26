// Re-export canonical types from lib/api
export type {
  LoginRequest,
  AuthResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UserInfo,
} from "@/lib/api/auth.api";

export type { UserType, AccountStatus } from "@/lib/api/types";

// Auth store types (kept here because auth.store.ts owns the shape)
export interface AuthState {
  user: import("@/lib/api/auth.api").UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: import("@/lib/api/auth.api").UserInfo, accessToken: string) => void;
  setRefreshToken: (token: string) => void;
  clearAuth: () => void;
}
