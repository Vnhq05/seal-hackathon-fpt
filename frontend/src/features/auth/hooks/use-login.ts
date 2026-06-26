"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, type LoginRequest } from "@/lib/api/auth.api";
import type { UserType } from "@/lib/api/types";
import { useAuthStore } from "@/features/auth/store/auth.store";

const USER_TYPE_HOME: Record<UserType, string> = {
  SYSTEM_ADMIN: "/admin",
  EVENT_COORDINATOR: "/coordinator",
  LECTURER: "/lecturer",
  FPT_STUDENT: "/student",
  EXTERNAL_STUDENT: "/student",
};

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setRefreshToken = useAuthStore((state) => state.setRefreshToken);

  const mutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      setRefreshToken(data.refreshToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", data.accessToken);
        document.cookie = "auth-check=1; path=/; SameSite=Lax";
      }
      router.push(USER_TYPE_HOME[data.user.userType] ?? "/student");
    },
  });

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
