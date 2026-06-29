"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api";
import type { CreateSubmissionRequest, SubmissionResponse } from "@/lib/api";
import { TEAM_SUBMISSION_KEY } from "@/features/submissions/hooks/use-team-submission";
import { MY_SUBMISSIONS_KEY } from "@/features/submissions/hooks/use-my-submissions";
import { SUBMISSION_DETAIL_KEY } from "@/features/submissions/hooks/use-submission-detail";

export interface SubmitSubmissionPayload {
  roundId: string;
  request: CreateSubmissionRequest;
  pdfFile?: File | null;
  teamId?: string;
}

export function useSubmitSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roundId, request, pdfFile }: SubmitSubmissionPayload) =>
      submissionApi.submit(roundId, request, pdfFile),
    onSuccess: (res: SubmissionResponse, { roundId, teamId }) => {
      queryClient.invalidateQueries({ queryKey: [MY_SUBMISSIONS_KEY, roundId] });
      queryClient.invalidateQueries({ queryKey: [SUBMISSION_DETAIL_KEY, roundId, res.id] });
      if (teamId) {
        queryClient.invalidateQueries({ queryKey: [TEAM_SUBMISSION_KEY, roundId, teamId] });
      }
      queryClient.invalidateQueries({ queryKey: ["team-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["team-submission", roundId] });
    },
  });
}
