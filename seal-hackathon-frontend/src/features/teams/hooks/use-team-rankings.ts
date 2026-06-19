import { useQuery } from "@tanstack/react-query";
import { fetchTeamRankings } from "@/features/teams/services/team-ranking.service";

export const TEAM_RANKINGS_KEY = "team-rankings" as const;

export function useTeamRankings() {
  return useQuery({
    queryKey: [TEAM_RANKINGS_KEY],
    queryFn: fetchTeamRankings,
  });
}
