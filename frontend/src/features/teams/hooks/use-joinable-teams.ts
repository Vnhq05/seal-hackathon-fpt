import { useQuery } from "@tanstack/react-query";
import { joinRequestApi } from "@/lib/api/join-request.api";

export const JOINABLE_TEAMS_KEY = "joinable-teams" as const;

export function useJoinableTeams(
  eventId: string,
  options?: { enabled?: boolean; recruitingOnly?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const recruitingOnly = options?.recruitingOnly ?? false;

  return useQuery({
    queryKey: [JOINABLE_TEAMS_KEY, eventId, recruitingOnly],
    queryFn: () => joinRequestApi.getJoinable(eventId, { recruitingOnly }),
    enabled: !!eventId && enabled,
  });
}
