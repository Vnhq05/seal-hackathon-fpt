"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  submitProject,
  saveProjectDraft,
} from "@/features/submissions/services/submit-project.service";
import type { SubmitProjectRequest } from "@/features/submissions/types/submit-project.types";

export function useSubmitProject() {
  const router = useRouter();

  const submitMutation = useMutation({
    mutationFn: (payload: SubmitProjectRequest) => submitProject(payload),
    onSuccess: () => {
      router.push("/participant/submissions");
    },
  });

  const draftMutation = useMutation({
    mutationFn: (payload: SubmitProjectRequest) => saveProjectDraft(payload),
    onSuccess: () => {
      router.push("/participant/submissions");
    },
  });

  return {
    submit: submitMutation.mutate,
    saveDraft: draftMutation.mutate,
    isSubmitting: submitMutation.isPending,
    isSavingDraft: draftMutation.isPending,
    submitError: submitMutation.error,
    draftError: draftMutation.error,
    isSubmitError: submitMutation.isError,
    isDraftError: draftMutation.isError,
  };
}
