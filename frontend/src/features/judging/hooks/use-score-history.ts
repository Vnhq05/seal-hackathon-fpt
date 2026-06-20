import { useQuery } from "@tanstack/react-query";
import type { ScoreHistoryResponse } from "@/features/judging/types/judge.types";

export const SCORE_HISTORY_KEY = "judge-score-history" as const;

// TODO: backend endpoint not implemented yet — /judge/score-history does not exist.
// To implement this properly, we would need to iterate over all rounds the judge
// is assigned to and call judgingApi.getMyScores(roundId) for each. This requires
// knowing the assigned rounds first (which also lacks a dedicated endpoint).
// Returning empty data as a placeholder.
export function useScoreHistory() {
  return useQuery<ScoreHistoryResponse>({
    queryKey: [SCORE_HISTORY_KEY],
    queryFn: async (): Promise<ScoreHistoryResponse> => {
      return { data: [] };
    },
  });
}
