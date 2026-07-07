import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { progressApi } from "@/lib/api/progress.api";
import { roundApi } from "@/lib/api/round.api";
import { teamApi } from "@/lib/api/team.api";
import { findCurrentRound } from "@/features/lecturer-mentor/lib/mentor-team-mappers";
import type { TeamProgressResponse } from "@/lib/api/progress.api";

export const MY_TEAM_PROGRESS_KEY = "my-team-progress" as const;

export function useMyTeamProgress(eventId?: string) {
  return useQuery<TeamProgressResponse | null>({
    queryKey: [MY_TEAM_PROGRESS_KEY, eventId],
    queryFn: async (): Promise<TeamProgressResponse | null> => {
      if (!eventId) return null;
      const [rounds, myTeam] = await Promise.all([
        roundApi.list(eventId),
        teamApi.getMyTeam(eventId).catch(() => null),
      ]);
      if (!myTeam) return null;
      const currentRound = findCurrentRound(rounds);
      if (!currentRound) return null;
      const progressList = await progressApi.getByRound(eventId, currentRound.id);
      return progressList.find((p) => p.teamId === myTeam.id) ?? null;
    },
    enabled: !!eventId,
  });
}

export function useActiveEventProgress() {
  return useQuery<TeamProgressResponse[]>({
    queryKey: [MY_TEAM_PROGRESS_KEY, "coordinator-at-risk"],
    queryFn: async (): Promise<TeamProgressResponse[]> => {
      const events = await eventApi.list({ status: "ACTIVE", page: 0, size: 5 });
      const atRisk: TeamProgressResponse[] = [];
      for (const event of events.content) {
        const rounds = await roundApi.list(event.id);
        const currentRound = findCurrentRound(rounds);
        if (!currentRound) continue;
        const progress = await progressApi.getByRound(event.id, currentRound.id);
        atRisk.push(
          ...progress.filter((p) => p.riskLevel !== "OK"),
        );
      }
      return atRisk;
    },
  });
}
