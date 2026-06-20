import { useMutation, useQueryClient } from "@tanstack/react-query";
import { judgingApi } from "@/lib/api/judging.api";
import type { ScoreSubmissionRequest } from "@/lib/api/judging.api";
import { SUBMISSION_SCORING_KEY } from "@/features/judging/hooks/use-submission-scoring";
import { ROUND_SUBMISSIONS_KEY } from "@/features/judging/hooks/use-round-submissions";
import { JUDGE_DASHBOARD_KEY } from "@/features/judging/hooks/use-judge-dashboard";
import { SCORE_HISTORY_KEY } from "@/features/judging/hooks/use-score-history";

interface SubmitScoresInput {
  roundId: string;
  body: ScoreSubmissionRequest;
  /** If provided, updates an existing score instead of creating a new one */
  existingScoreId?: string;
}

export function useSubmitScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roundId, body, existingScoreId }: SubmitScoresInput) =>
      existingScoreId
        ? judgingApi.updateScore(roundId, existingScoreId, body)
        : judgingApi.submitScore(roundId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBMISSION_SCORING_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROUND_SUBMISSIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [JUDGE_DASHBOARD_KEY] });
      queryClient.invalidateQueries({ queryKey: [SCORE_HISTORY_KEY] });
    },
  });
}
