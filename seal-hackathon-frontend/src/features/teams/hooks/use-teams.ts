import { useQuery } from "@tanstack/react-query";
import { fetchTeams } from "@/features/teams/services/team.service";
import type { TeamsListParams } from "@/features/teams/types/team.types";

export const TEAMS_KEY = "teams" as const;

export function useTeams(params?: TeamsListParams) {
  return useQuery({
    queryKey: [TEAMS_KEY, params],
    queryFn: () => fetchTeams(params),
  });
}
