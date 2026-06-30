"use client";

import { useMutation } from "@tanstack/react-query";
import { enrollmentApi } from "@/lib/api";
import type { ExternalRegistrationFormValues } from "@/features/events/schemas/external-registration.schema";

export function useExternalEnrollment(eventId: string, semesterRequired = false) {
  const mutation = useMutation({
    mutationFn: (values: ExternalRegistrationFormValues) => {
      const semester =
        values.semester != null && !Number.isNaN(values.semester)
          ? Math.trunc(values.semester)
          : undefined;

      if (semesterRequired && semester == null) {
        throw new Error("Semester is required for this event.");
      }

      return enrollmentApi.enrollExternal(eventId, {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        studentId: values.studentId.trim(),
        universityName: values.universityName.trim(),
        studentStanding: "ENROLLED",
        ...(semester != null ? { semester } : {}),
      });
    },
  });

  return {
    submit: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
  };
}
