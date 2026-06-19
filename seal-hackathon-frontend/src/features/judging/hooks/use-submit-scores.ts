import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitScores } from "@/features/judging/services/judge.service";
import { SUBMISSION_SCORING_KEY } from "@/features/judging/hooks/use-submission-scoring";
import { ROUND_SUBMISSIONS_KEY } from "@/features/judging/hooks/use-round-submissions";
import { JUDGE_DASHBOARD_KEY } from "@/features/judging/hooks/use-judge-dashboard";
import { SCORE_HISTORY_KEY } from "@/features/judging/hooks/use-score-history";

export function useSubmitScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitScores,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBMISSION_SCORING_KEY] });
      queryClient.invalidateQueries({ queryKey: [ROUND_SUBMISSIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [JUDGE_DASHBOARD_KEY] });
      queryClient.invalidateQueries({ queryKey: [SCORE_HISTORY_KEY] });
    },
  });
}
