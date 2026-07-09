import { useQuery } from "@tanstack/react-query";
import { judgingApi } from "@/lib/api/judging.api";
import type { RoundSubmissionsResponse, RoundSubmissionsParams } from "@/features/judging/types/judge.types";

export const ROUND_SUBMISSIONS_KEY = "judge-round-submissions" as const;

/**
 * Server-side filtered submissions for the current judge's assignment scope.
 */
export function useRoundSubmissions(
  roundId: string,
  params?: RoundSubmissionsParams,
) {
  return useQuery<RoundSubmissionsResponse>({
    queryKey: [ROUND_SUBMISSIONS_KEY, roundId, params],
    queryFn: async (): Promise<RoundSubmissionsResponse> => {
      const [submissions, assignments] = await Promise.all([
        judgingApi.getRoundSubmissions(roundId, params?.filter),
        judgingApi.getMyAssignments(),
      ]);

      const roundAssignments = assignments.filter((a) => a.roundId === roundId);
      const first = roundAssignments[0];

      const items = submissions.map((s) => ({
        id: s.submissionId,
        teamId: s.teamId,
        teamName: s.teamName,
        trackName: s.trackName,
        groupName: s.groupName,
        score: s.weightedScore != null ? Number(s.weightedScore) : null,
        maxScore: s.maxWeightedScore != null ? Number(s.maxWeightedScore) : 0,
        status: s.scoringStatus,
        submittedAt: s.submittedAt,
        scoringDeadline: s.scoringDeadline,
        scoringAllowed: s.scoringAllowed,
        scoringDeniedReason: s.scoringDeniedReason,
        conflictOfInterest: s.conflictOfInterest,
      }));

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
