import { useQuery } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api";

export const TEAM_SUBMISSION_KEY = "team-submission" as const;

export function useTeamSubmission(
  roundId: string | undefined,
  teamId: string | undefined,
) {
  return useQuery({
    queryKey: [TEAM_SUBMISSION_KEY, roundId, teamId],
    queryFn: () => submissionApi.getByTeamOptional(roundId!, teamId!),
    enabled: !!roundId && !!teamId,
  });
}
