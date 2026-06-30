import { useQuery } from "@tanstack/react-query";
import { criteriaApi } from "@/lib/api/criteria.api";
import { judgingApi } from "@/lib/api/judging.api";
import { submissionApi } from "@/lib/api/submission.api";
import { computeMaxWeightedScore, computeWeightedScore } from "@/features/judging/schemas/scoring.schema";
import type { RoundSubmissionsResponse, RoundSubmissionsParams } from "@/features/judging/types/judge.types";

export const ROUND_SUBMISSIONS_KEY = "judge-round-submissions" as const;

/**
 * Lists only teams assigned to the current judge for the round.
 */
export function useRoundSubmissions(
  roundId: string,
  params?: RoundSubmissionsParams,
) {
  return useQuery<RoundSubmissionsResponse>({
    queryKey: [ROUND_SUBMISSIONS_KEY, roundId, params],
    queryFn: async (): Promise<RoundSubmissionsResponse> => {
      const [assignments, myScores, criteria] = await Promise.all([
        judgingApi.getMyAssignments(),
        judgingApi.getMyScores(roundId).catch(() => []),
        criteriaApi.list(roundId).catch(() => []),
      ]);

      const roundAssignments = assignments.filter((a) => a.roundId === roundId);

      const weightByCriteriaId = new Map(criteria.map((c) => [c.id, c.weight]));
      const maxWeighted = computeMaxWeightedScore(
        criteria.map((c) => ({ maxScore: c.maxScore ?? 5, weight: c.weight })),
      );

      const scoredMap = new Map(myScores.map((s) => [s.submissionId, s]));

      const submissions = await Promise.all(
        roundAssignments.map(async (a) => {
          const sub = a.submissionId
            ? await submissionApi.getByTeam(roundId, a.teamId).catch(() => null)
            : null;
          return { assignment: a, sub };
        }),
      );

      let items = submissions
        .filter((entry) => entry.sub != null)
        .map(({ assignment: a, sub }) => {
          const score = scoredMap.get(sub!.id);
          const totalScore = score
            ? score.details.reduce(
                (sum, d) =>
                  sum +
                  computeWeightedScore(
                    d.score,
                    weightByCriteriaId.get(d.criteriaId) ?? 0,
                  ),
                0,
              )
            : null;
          return {
            id: sub!.id,
            teamId: a.teamId,
            teamName: a.teamName,
            score: totalScore,
            maxScore: maxWeighted || 5,
            status: score ? ("scored" as const) : ("unscored" as const),
            submittedAt: sub!.createdAt,
          };
        });

      if (params?.filter && params.filter !== "all") {
        items = items.filter((i) => i.status === params.filter);
      }

      const first = roundAssignments[0];

      return {
        data: items,
        roundName: first?.roundName ?? "",
        hackathonName: first?.eventName ?? "",
        total: items.length,
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      };
    },
    enabled: !!roundId,
  });
}
