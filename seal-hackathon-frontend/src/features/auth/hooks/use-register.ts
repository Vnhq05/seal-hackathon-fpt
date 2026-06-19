"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { registerUser } from "@/features/auth/services/auth.service";
import type { RegisterRequest } from "@/features/auth/types/auth.types";
import type { RegisterFormValues } from "@/features/auth/schemas/register.schema";

function toRegisterRequest(values: RegisterFormValues): RegisterRequest {
  return {
    name: values.fullName,
    email: values.email,
    password: values.password,
    userType: values.userType,
    studentId: values.userType === "fpt_student" ? values.studentId : undefined,
  };
}

export function useRegister() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (payload: RegisterRequest) => registerUser(payload),
    onSuccess: () => {
      router.push("/login?registered=true");
    },
  });

  return {
    register: (values: RegisterFormValues) =>
      mutation.mutate(toRegisterRequest(values)),
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
