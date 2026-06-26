import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/lib/env";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { ApiResponse } from "@/lib/api/types";
import type { AuthResponse } from "@/lib/api/auth.api";

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

function clearSessionAndRedirect() {
  useAuthStore.getState().clearAuth();
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    document.cookie = "auth-check=; path=/; Max-Age=0; SameSite=Lax";
    window.location.href = "/login";
  }
}

function extractBackendMessage(error: AxiosError<{ message?: string }>): string | undefined {
  return error.response?.data?.message;
}

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes("/auth/login") || url.includes("/auth/refresh") || url.includes("/auth/logout");
}

apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const backendMessage = extractBackendMessage(error);

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isAuthEndpoint(originalRequest.url)) {
        clearSessionAndRedirect();
        return Promise.reject(new Error(backendMessage ?? "Unauthorized"));
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        clearSessionAndRedirect();
        return Promise.reject(new Error(backendMessage ?? "Unauthorized"));
      }

      try {
        const { data: wrapper } = await apiClient.post<ApiResponse<AuthResponse>>(
          "/auth/refresh",
          { refreshToken },
        );

        if (!wrapper.success || !wrapper.data) {
          throw new Error(wrapper.message ?? "Token refresh failed");
        }

        const { user, accessToken, refreshToken: newRefreshToken } = wrapper.data;
        useAuthStore.getState().setAuth(user, accessToken);
        useAuthStore.getState().setRefreshToken(newRefreshToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", accessToken);
        }

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearSessionAndRedirect();
        const refreshMessage =
          refreshError instanceof Error ? refreshError.message : backendMessage ?? "Unauthorized";
        return Promise.reject(new Error(refreshMessage));
      } finally {
        isRefreshing = false;
      }
    }

    if (backendMessage) {
      return Promise.reject(new Error(backendMessage));
    }

    return Promise.reject(error);
  },
);
