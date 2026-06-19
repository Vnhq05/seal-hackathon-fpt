import { useQuery } from "@tanstack/react-query";
import { fetchTeamDetail } from "@/features/teams/services/team.service";

export const TEAM_DETAIL_KEY = "team-detail" as const;

export function useTeamDetail(teamId: string) {
  return useQuery({
    queryKey: [TEAM_DETAIL_KEY, teamId],
    queryFn: () => fetchTeamDetail(teamId),
    enabled: !!teamId,
  });
}
