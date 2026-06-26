"use client";

import { useMutation } from "@tanstack/react-query";
import { enrollmentApi } from "@/lib/api";
import type { ExternalRegistrationFormValues } from "@/features/events/schemas/external-registration.schema";

export function useExternalEnrollment(eventId: string) {
  const mutation = useMutation({
    mutationFn: (values: ExternalRegistrationFormValues) =>
      enrollmentApi.enrollExternal(eventId, values),
  });

  return {
    submit: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
  };
}
