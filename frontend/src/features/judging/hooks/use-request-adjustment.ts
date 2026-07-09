import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  scoreReviewApi,
  type JudgeScoreReviewRequest,
} from "@/lib/api/score-review.api";
import { SCORE_REVIEWS_KEY } from "@/features/admin/hooks/use-score-reviews";
import { JUDGE_ASSIGNMENTS_KEY } from "@/features/judging/hooks/use-judge-scoring-assignments";
import { SCORE_REVIEW_CONTEXT_KEY } from "@/features/judging/hooks/use-score-review-context";
import { SUBMISSION_SCORING_KEY } from "@/features/judging/hooks/use-submission-scoring";

export function useRequestAdjustment(eventId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: JudgeScoreReviewRequest) =>
      scoreReviewApi.requestAdjustment(eventId!, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [SCORE_REVIEWS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [SCORE_REVIEW_CONTEXT_KEY, eventId, variables.submissionId] });
      queryClient.invalidateQueries({ queryKey: [SUBMISSION_SCORING_KEY] });
    },
  });
}
