import { useQuery } from "@tanstack/react-query";
import { fetchMyTeam } from "@/features/teams/services/team.service";

export const MY_TEAM_KEY = "my-team" as const;

export function useMyTeam() {
  return useQuery({
    queryKey: [MY_TEAM_KEY],
    queryFn: fetchMyTeam,
  });
}
