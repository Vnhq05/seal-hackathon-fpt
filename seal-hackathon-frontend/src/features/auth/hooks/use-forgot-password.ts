"use client";

import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "@/features/auth/services/auth.service";
import type { ForgotPasswordRequest } from "@/features/auth/types/auth.types";

export function useForgotPassword() {
  const mutation = useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => forgotPassword(payload),
  });

  return {
    sendResetLink: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
