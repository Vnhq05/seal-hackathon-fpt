"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi, type RegisterRequest } from "@/lib/api/auth.api";
import type { RegisterFormValues } from "@/features/auth/schemas/register.schema";

function toRegisterRequest(values: RegisterFormValues): RegisterRequest {
  return {
    fullName: values.fullName,
    email: values.email,
    password: values.password,
    userType: values.userType,
    studentId: values.studentId,
    universityName:
      values.userType === "EXTERNAL_STUDENT"
        ? values.universityName
        : undefined,
    semester: values.semester,
  };
}

export function useRegister() {
  const mutation = useMutation({
    mutationFn: (payload: RegisterRequest) => authApi.register(payload),
  });

  return {
    register: (values: RegisterFormValues) =>
      mutation.mutate(toRegisterRequest(values)),
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
  };
}
