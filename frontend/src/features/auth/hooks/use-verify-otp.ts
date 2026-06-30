"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi, type VerifyOtpRequest } from "@/lib/api/auth.api";

export function useVerifyOtp() {
  const mutation = useMutation({
    mutationFn: (payload: VerifyOtpRequest) => authApi.verifyOtp(payload),
  });

  return {
    verifyOtp: (payload: VerifyOtpRequest) => mutation.mutate(payload),
    verifyOtpAsync: (payload: VerifyOtpRequest) => mutation.mutateAsync(payload),
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
  };
}
