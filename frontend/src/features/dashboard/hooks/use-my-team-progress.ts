import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { progressApi } from "@/lib/api/progress.api";
import { roundApi } from "@/lib/api/round.api";
import { teamApi } from "@/lib/api/team.api";
import { findCurrentRound } from "@/features/lecturer-mentor/lib/mentor-team-mappers";
import type { TeamProgressResponse } from "@/lib/api/progress.api";

export const MY_TEAM_PROGRESS_KEY = "my-team-progress" as const;

export interface MyTeamProgressResult {
  progress: TeamProgressResponse | null;
  submissionDeadline: string | null;
  eventName: string | null;
}

export function useMyTeamProgress(eventId?: string) {
  return useQuery<MyTeamProgressResult | null>({
    queryKey: [MY_TEAM_PROGRESS_KEY, eventId],
    queryFn: async (): Promise<MyTeamProgressResult | null> => {
      if (!eventId) return null;
      const [event, rounds, myTeam] = await Promise.all([
        eventApi.getById(eventId),
        roundApi.list(eventId),
        teamApi.getMyTeam(eventId).catch(() => null),
      ]);
      if (!myTeam) return null;
      const currentRound = findCurrentRound(rounds);
      if (!currentRound) {
        return { progress: null, submissionDeadline: null, eventName: event.name };
      }
      const progressList = await progressApi.getByRound(eventId, currentRound.id);
      return {
        progress: progressList.find((p) => p.teamId === myTeam.id) ?? null,
        submissionDeadline: currentRound.submissionDeadline,
        eventName: event.name,
      };
    },
    enabled: !!eventId,
  });
}

