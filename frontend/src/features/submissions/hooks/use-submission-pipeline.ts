import { useQuery } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api";
import type { SubmissionResponse } from "@/lib/api";

export const SUBMISSION_PIPELINE_KEY = "submission-pipeline" as const;

// TODO: backend has no dedicated pipeline endpoint — lists all submissions for a round
export function useSubmissionPipeline(roundId: string | undefined) {
  return useQuery({
    queryKey: [SUBMISSION_PIPELINE_KEY, roundId],
    queryFn: (): Promise<SubmissionResponse[]> => submissionApi.list(roundId!),
    enabled: !!roundId,
  });
}
