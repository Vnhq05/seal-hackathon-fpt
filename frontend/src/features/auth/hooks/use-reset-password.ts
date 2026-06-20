"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth.api";

interface UseResetPasswordOptions {
  token: string;
}

export function useResetPassword({ token }: UseResetPasswordOptions) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (newPassword: string) => authApi.resetPassword({ token, newPassword }),
    onSuccess: () => router.push("/login?reset=success"),
  });

  return {
    submitReset: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
