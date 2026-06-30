import { useMutation, useQueryClient } from "@tanstack/react-query";
import { judgingApi } from "@/lib/api/judging.api";
import type { ScoreSubmissionRequest } from "@/lib/api/judging.api";
import { ASSIGNED_ROUNDS_KEY } from "@/features/judging/hooks/use-assigned-rounds";
import { JUDGE_DASHBOARD_KEY } from "@/features/judging/hooks/use-judge-dashboard";
import { JUDGE_ASSIGNMENTS_KEY } from "@/features/judging/hooks/use-judge-scoring-assignments";
import { ROUND_SUBMISSIONS_KEY } from "@/features/judging/hooks/use-round-submissions";
import { SCORE_HISTORY_KEY } from "@/features/judging/hooks/use-score-history";
import { SUBMISSION_SCORING_KEY } from "@/features/judging/hooks/use-submission-scoring";

interface SaveDraftInput {
  roundId: string;
  body: ScoreSubmissionRequest;
  /** If provided, updates an existing draft score */
  existingScoreId?: string;
}

/**
 * Saves a scoring draft. Uses the same submit/update endpoints since the
 * backend tracks IN_PROGRESS status automatically.
 * The old /judge/submissions/:id/scores/draft endpoint does not exist.
 */
export function useSaveScoringDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roundId, body, existingScoreId }: SaveDraftInput) => {
      const draftBody = { ...body, complete: false };
      return existingScoreId
        ? judgingApi.updateScore(roundId, existingScoreId, draftBody)
        : judgingApi.submitScore(roundId, draftBody);
    },
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
