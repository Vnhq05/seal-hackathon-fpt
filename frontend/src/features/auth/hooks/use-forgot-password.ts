"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi, type ForgotPasswordRequest } from "@/lib/api/auth.api";

export function useForgotPassword() {
  const mutation = useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => authApi.forgotPassword(payload),
  });

  return {
    sendResetLink: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
