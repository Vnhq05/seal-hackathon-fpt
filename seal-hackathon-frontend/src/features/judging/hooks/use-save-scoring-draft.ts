import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveScoringDraft } from "@/features/judging/services/judge.service";
import { SUBMISSION_SCORING_KEY } from "@/features/judging/hooks/use-submission-scoring";

export function useSaveScoringDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveScoringDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBMISSION_SCORING_KEY] });
    },
  });
}
