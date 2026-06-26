import { useQuery } from "@tanstack/react-query";
import { joinRequestApi } from "@/lib/api/join-request.api";

export const JOINABLE_TEAMS_KEY = "joinable-teams" as const;

export function useJoinableTeams(eventId: string, enabled = true) {
  return useQuery({
    queryKey: [JOINABLE_TEAMS_KEY, eventId],
    queryFn: () => joinRequestApi.getJoinable(eventId),
    enabled: !!eventId && enabled,
  });
}
