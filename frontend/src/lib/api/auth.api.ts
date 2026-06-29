import { api } from "./api-client";
import type { UserType, AccountStatus, StudentStanding } from "./types";
import type { AllowedEmailDomainResponse } from "./event.api";

// ═══ Request types ═══

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  studentId?: string;
  universityName?: string;
  userType: Extract<UserType, "FPT_STUDENT" | "EXTERNAL_STUDENT">;
  studentStanding: Extract<StudentStanding, "ENROLLED">;
  semester?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ═══ Response types ═══

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  userType: UserType;
  status: AccountStatus;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: UserInfo;
}

// ═══ API calls ═══

export const authApi = {
  listRegistrationAllowedDomains(): Promise<AllowedEmailDomainResponse[]> {
    return api.get<AllowedEmailDomainResponse[]>("/public/registration/allowed-email-domains");
  },

  register(body: RegisterRequest): Promise<string> {
    return api.post<string>("/auth/register", body);
  },

  login(body: LoginRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>("/auth/login", body);
  },

  refresh(body: RefreshTokenRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>("/auth/refresh", body);
  },

  logout(body: RefreshTokenRequest): Promise<void> {
    return api.post<void>("/auth/logout", body);
  },

  forgotPassword(body: ForgotPasswordRequest): Promise<void> {
    return api.post<void>("/auth/forgot-password", body);
  },

  resetPassword(body: ResetPasswordRequest): Promise<void> {
    return api.post<void>("/auth/reset-password", body);
  },
};
