import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  scoreReviewApi,
  type JudgeScoreReviewRequest,
} from "@/lib/api/score-review.api";
import { SCORE_REVIEWS_KEY } from "@/features/admin/hooks/use-score-reviews";
import { JUDGE_ASSIGNMENTS_KEY } from "@/features/judging/hooks/use-judge-scoring-assignments";

export function useRequestAdjustment(eventId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: JudgeScoreReviewRequest) =>
      scoreReviewApi.requestAdjustment(eventId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCORE_REVIEWS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY] });
    },
  });
}
