import { useMutation, useQueryClient } from "@tanstack/react-query";
import { judgingApi } from "@/lib/api/judging.api";
import type { ScoreSubmissionRequest } from "@/lib/api/judging.api";
import { ASSIGNED_ROUNDS_KEY } from "@/features/judging/hooks/use-assigned-rounds";
import { JUDGE_DASHBOARD_KEY } from "@/features/judging/hooks/use-judge-dashboard";
import { JUDGE_ASSIGNMENTS_KEY } from "@/features/judging/hooks/use-judge-scoring-assignments";
import { ROUND_SUBMISSIONS_KEY } from "@/features/judging/hooks/use-round-submissions";
import { SCORE_HISTORY_KEY } from "@/features/judging/hooks/use-score-history";
import { SUBMISSION_SCORING_KEY } from "@/features/judging/hooks/use-submission-scoring";

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
        ? judgingApi.updateScore(roundId, existingScoreId, { ...body, complete: body.complete ?? true })
        : judgingApi.submitScore(roundId, { ...body, complete: body.complete ?? true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBMISSION_SCORING_KEY] });
      queryClient.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROUND_SUBMISSIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [SCORE_HISTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [JUDGE_DASHBOARD_KEY] });
      queryClient.invalidateQueries({ queryKey: [ASSIGNED_ROUNDS_KEY] });
    },
  });
}
