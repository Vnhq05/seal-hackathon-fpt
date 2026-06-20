import { useQuery } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api/submission.api";
import { judgingApi } from "@/lib/api/judging.api";
import type { RoundSubmissionsResponse, RoundSubmissionsParams } from "@/features/judging/types/judge.types";

export const ROUND_SUBMISSIONS_KEY = "judge-round-submissions" as const;

/**
 * Fetches submissions for a round using submissionApi.list() and enriches with
 * the judge's own scores via judgingApi.getMyScores().
 */
export function useRoundSubmissions(
  roundId: string,
  params?: RoundSubmissionsParams,
) {
  return useQuery<RoundSubmissionsResponse>({
    queryKey: [ROUND_SUBMISSIONS_KEY, roundId, params],
    queryFn: async (): Promise<RoundSubmissionsResponse> => {
      const [submissions, myScores] = await Promise.all([
        submissionApi.list(roundId),
        judgingApi.getMyScores(roundId).catch(() => []),
      ]);

      const scoredMap = new Map(
        myScores.map((s) => [s.submissionId, s]),
      );

      let items = submissions.map((sub) => {
        const score = scoredMap.get(sub.id);
        const totalScore = score
          ? score.details.reduce((sum, d) => sum + d.score, 0)
          : null;
        return {
          id: sub.id,
          teamName: sub.teamId,
          score: totalScore,
          maxScore: 100,
          status: score ? ("scored" as const) : ("unscored" as const),
          submittedAt: sub.createdAt,
        };
      });

      // Apply filter if provided
      if (params?.filter && params.filter !== "all") {
        items = items.filter((i) => i.status === params.filter);
      }

      return {
        data: items,
        roundName: "",
        hackathonName: "",
        total: items.length,
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      };
    },
    enabled: !!roundId,
  });
}
