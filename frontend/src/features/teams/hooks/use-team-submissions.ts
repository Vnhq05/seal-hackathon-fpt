import { useQuery } from "@tanstack/react-query";
import { submissionApi, roundApi } from "@/lib/api";
import type { SubmissionResponse, RoundResponse } from "@/lib/api";

export interface TeamRoundSubmission {
  round: RoundResponse;
  submission: SubmissionResponse | null;
}

async function fetchTeamSubmissions(eventId: string, teamId: string): Promise<TeamRoundSubmission[]> {
  const rounds = await roundApi.list(eventId);
  const results: TeamRoundSubmission[] = [];

  for (const round of rounds) {
    try {
      const sub = await submissionApi.getByTeam(round.id, teamId);
      results.push({ round, submission: sub });
    } catch {
      results.push({ round, submission: null });
    }
  }

  return results;
}

export function useTeamSubmissions(eventId: string | undefined, teamId: string | undefined) {
  return useQuery({
    queryKey: ["team-submissions", eventId, teamId],
    queryFn: () => fetchTeamSubmissions(eventId!, teamId!),
    enabled: !!eventId && !!teamId,
  });
}
