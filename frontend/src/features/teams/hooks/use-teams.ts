import { useQuery } from "@tanstack/react-query";
import { teamApi } from "@/lib/api";
import type { PageParams } from "@/lib/api";

export const TEAMS_KEY = "teams" as const;

export function useTeams(eventId: string, params?: PageParams) {
  return useQuery({
    queryKey: [TEAMS_KEY, eventId, params],
    queryFn: () => teamApi.list(eventId, params),
    enabled: !!eventId,
  });
}
