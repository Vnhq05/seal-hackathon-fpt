import { useQuery } from "@tanstack/react-query";
import { fetchScoreHistory } from "@/features/judging/services/judge.service";

export const SCORE_HISTORY_KEY = "judge-score-history" as const;

export function useScoreHistory() {
  return useQuery({
    queryKey: [SCORE_HISTORY_KEY],
    queryFn: fetchScoreHistory,
  });
}
