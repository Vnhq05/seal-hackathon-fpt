import { useQuery } from "@tanstack/react-query";
import { judgingApi } from "@/lib/api/judging.api";
import type { ScoreHistoryResponse } from "@/features/judging/types/judge.types";

export const SCORE_HISTORY_KEY = "judge-score-history" as const;

export function useScoreHistory() {
  return useQuery<ScoreHistoryResponse>({
    queryKey: [SCORE_HISTORY_KEY],
    queryFn: async (): Promise<ScoreHistoryResponse> => {
      const scores = await judgingApi.getMyScoresHistory();
      return {
        data: scores
          .filter((s) => s.status === "COMPLETED" || s.status === "LOCKED")
          .map((s) => ({
            id: s.id,
            teamName: s.submissionId,
            hackathonName: "",
            roundName: s.roundId,
            totalWeightedScore: s.details.reduce((sum, d) => sum + d.score, 0),
            maxScore: s.details.length * 10,
            scoredAt: s.completedAt ?? s.startedAt,
            criteriaBreakdown: s.details.map((d) => ({
              criterionName: d.criteriaName,
              score: d.score,
              maxScore: 10,
              weight: 0,
            })),
          })),
      };
    },
  });
}
