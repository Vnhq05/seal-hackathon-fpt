import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  scoreReviewApi,
  type ResolveScoreReviewRequest,
  type ScoreReviewStatus,
} from "@/lib/api/score-review.api";
import { JUDGE_ASSIGNMENTS_KEY } from "@/features/judging/hooks/use-judge-scoring-assignments";

export const SCORE_REVIEWS_KEY = "score-reviews" as const;

export function useScoreReviews(
  eventId: string,
  params?: { roundId?: string; status?: ScoreReviewStatus },
) {
  return useQuery({
    queryKey: [SCORE_REVIEWS_KEY, eventId, params],
    queryFn: () => scoreReviewApi.list(eventId, params),
    enabled: !!eventId,
  });
}

export function useScoreReviewDetail(eventId: string, reviewId: string | null) {
  return useQuery({
    queryKey: [SCORE_REVIEWS_KEY, eventId, reviewId],
    queryFn: () => scoreReviewApi.getById(eventId, reviewId!),
    enabled: !!eventId && !!reviewId,
  });
}

export function useResolveScoreReview(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      body,
    }: {
      reviewId: string;
      body: ResolveScoreReviewRequest;
    }) => scoreReviewApi.resolve(eventId, reviewId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCORE_REVIEWS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY] });
    },
  });
}
