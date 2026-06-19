import { useQuery } from "@tanstack/react-query";
import { fetchSubmissionForScoring } from "@/features/judging/services/judge.service";

export const SUBMISSION_SCORING_KEY = "judge-submission-scoring" as const;

export function useSubmissionScoring(submissionId: string) {
  return useQuery({
    queryKey: [SUBMISSION_SCORING_KEY, submissionId],
    queryFn: () => fetchSubmissionForScoring(submissionId),
    enabled: !!submissionId,
  });
}
