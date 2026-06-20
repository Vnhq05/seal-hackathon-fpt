"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, type LoginRequest } from "@/lib/api/auth.api";
import type { UserType } from "@/lib/api/types";
import { useAuthStore } from "@/features/auth/store/auth.store";

const USER_TYPE_HOME: Record<UserType, string> = {
  SYSTEM_ADMIN: "/admin",
  EVENT_COORDINATOR: "/staff",
  MENTOR: "/mentor",
  JUDGE: "/judge",
  LECTURER: "/lecturer",
  FPT_STUDENT: "/participant",
  EXTERNAL_STUDENT: "/participant",
};

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const mutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", data.accessToken);
      }
      router.push(USER_TYPE_HOME[data.user.userType] ?? "/participant");
    },
  });

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
