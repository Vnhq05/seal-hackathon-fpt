"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { submissionApi } from "@/lib/api";
import type { CreateSubmissionRequest } from "@/lib/api";

interface SubmitPayload {
  roundId: string;
  request: CreateSubmissionRequest;
  pdfFile?: File | null;
}

export function useSubmitProject() {
  const router = useRouter();

  const submitMutation = useMutation({
    mutationFn: (payload: SubmitPayload) =>
      submissionApi.submit(payload.roundId, payload.request, payload.pdfFile),
    onSuccess: () => {
      router.push("/student/submissions");
    },
  });

  return {
    submit: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error,
    isSubmitError: submitMutation.isError,
  };
}
