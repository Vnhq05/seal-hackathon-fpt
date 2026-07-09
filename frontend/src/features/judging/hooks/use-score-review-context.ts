import { useQuery } from "@tanstack/react-query";
import { scoreReviewApi } from "@/lib/api/score-review.api";
import { SUBMISSION_SCORING_KEY } from "@/features/judging/hooks/use-submission-scoring";

export const SCORE_REVIEW_CONTEXT_KEY = "score-review-context" as const;

export function useScoreReviewContext(
  eventId: string | null | undefined,
  submissionId: string | null | undefined,
) {
  return useQuery({
    queryKey: [SCORE_REVIEW_CONTEXT_KEY, eventId, submissionId],
    queryFn: () => scoreReviewApi.getSubmissionContext(eventId!, submissionId!),
    enabled: !!eventId && !!submissionId,
  });
}

export function invalidateScoreReviewContext(
  queryClient: { invalidateQueries: (opts: { queryKey: string[] }) => void },
  eventId: string | null | undefined,
  submissionId: string | null | undefined,
) {
  queryClient.invalidateQueries({ queryKey: [SCORE_REVIEW_CONTEXT_KEY, eventId ?? "", submissionId ?? ""] });
  queryClient.invalidateQueries({ queryKey: [SUBMISSION_SCORING_KEY] });
}
