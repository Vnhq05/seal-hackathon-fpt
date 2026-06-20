import { useQuery } from "@tanstack/react-query";
import { teamApi } from "@/lib/api";

export const TEAM_DETAIL_KEY = "team-detail" as const;

export function useTeamDetail(eventId: string, teamId: string) {
  return useQuery({
    queryKey: [TEAM_DETAIL_KEY, eventId, teamId],
    queryFn: () => teamApi.getById(eventId, teamId),
    enabled: !!eventId && !!teamId,
  });
}
