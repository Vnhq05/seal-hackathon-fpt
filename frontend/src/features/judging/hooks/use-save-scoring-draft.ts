import { useMutation, useQueryClient } from "@tanstack/react-query";
import { judgingApi } from "@/lib/api/judging.api";
import type { ScoreSubmissionRequest } from "@/lib/api/judging.api";
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
    mutationFn: ({ roundId, body, existingScoreId }: SaveDraftInput) =>
      existingScoreId
        ? judgingApi.updateScore(roundId, existingScoreId, body)
        : judgingApi.submitScore(roundId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBMISSION_SCORING_KEY] });
    },
  });
}
