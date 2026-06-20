import { useQuery } from "@tanstack/react-query";
import { teamApi } from "@/lib/api";

export const MY_TEAM_KEY = "my-team" as const;

export function useMyTeam(eventId: string) {
  return useQuery({
    queryKey: [MY_TEAM_KEY, eventId],
    queryFn: () => teamApi.getMyTeam(eventId),
    enabled: !!eventId,
  });
}
