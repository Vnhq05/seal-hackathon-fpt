"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/features/auth/services/auth.service";

interface UseResetPasswordOptions {
  token: string;
}

export function useResetPassword({ token }: UseResetPasswordOptions) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (password: string) => resetPassword({ token, password }),
    onSuccess: () => router.push("/login?reset=success"),
  });

  return {
    submitReset: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
