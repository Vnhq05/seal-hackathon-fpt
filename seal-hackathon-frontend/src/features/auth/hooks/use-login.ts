"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { loginUser } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { LoginRequest, UserRole } from "@/features/auth/types/auth.types";

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  organizer: "/staff",
  participant: "/participant",
};

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const mutation = useMutation({
    mutationFn: (credentials: LoginRequest) => loginUser(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", data.accessToken);
      }
      router.push(ROLE_HOME[data.user.role] ?? "/participant");
    },
  });

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
