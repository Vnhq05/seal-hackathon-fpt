import { useQuery } from "@tanstack/react-query";
import { criteriaApi } from "@/lib/api/criteria.api";
import { judgingApi } from "@/lib/api/judging.api";
import {
  computeMaxWeightedScore,
  computeWeightedScore,
} from "@/features/judging/schemas/scoring.schema";
import type { ScoreHistoryResponse } from "@/features/judging/types/judge.types";

export const SCORE_HISTORY_KEY = "judge-score-history" as const;

export function useScoreHistory() {
  return useQuery<ScoreHistoryResponse>({
    queryKey: [SCORE_HISTORY_KEY],
    queryFn: async (): Promise<ScoreHistoryResponse> => {
      const scores = await judgingApi.getMyScoresHistory();
      const roundIds = [...new Set(scores.map((s) => s.roundId))];
      const criteriaByRound = new Map(
        await Promise.all(
          roundIds.map(async (roundId) => {
            const criteria = await criteriaApi.list(roundId).catch(() => []);
            return [roundId, criteria] as const;
          }),
        ),
      );

      return {
        data: scores
          .filter((s) => s.status === "COMPLETED" || s.status === "LOCKED")
          .map((s) => {
            const criteria = criteriaByRound.get(s.roundId) ?? [];
            const weightById = new Map(criteria.map((c) => [c.id, c]));
            const maxWeighted = computeMaxWeightedScore(
              criteria.map((c) => ({ maxScore: c.maxScore ?? 5, weight: c.weight })),
            );
            const totalWeightedScore = s.details.reduce((sum, d) => {
              const c = weightById.get(d.criteriaId);
              return sum + computeWeightedScore(d.score, c?.weight ?? 0);
            }, 0);

            return {
              id: s.id,
              teamName: s.submissionId,
              hackathonName: "",
              roundName: s.roundId,
              totalWeightedScore,
              maxScore: maxWeighted || 5,
              scoredAt: s.completedAt ?? s.startedAt,
              criteriaBreakdown: s.details.map((d) => {
                const c = weightById.get(d.criteriaId);
                return {
                  criterionName: d.criteriaName,
                  score: d.score,
                  maxScore: c?.maxScore ?? 5,
                  weight: c?.weight ?? 0,
                };
              }),
            };
          }),
      };
    },
  });
}
