import { apiClient } from "@/lib/axios";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "@/features/auth/types/auth.types";

export async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", credentials);
  return data;
}

export async function logoutUser(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function refreshAccessToken(): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<{ accessToken: string }>("/auth/refresh");
  return data;
}

export async function registerUser(payload: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>("/auth/register", payload);
  return data;
}

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>(
    "/auth/forgot-password",
    payload,
  );
  return data;
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const { data } = await apiClient.post<ResetPasswordResponse>(
    "/auth/reset-password",
    payload,
  );
  return data;
}
