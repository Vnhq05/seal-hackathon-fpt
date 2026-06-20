import { useQuery } from "@tanstack/react-query";
import { teamApi } from "@/lib/api";
import type { TeamResponse } from "@/lib/api";

export const DASHBOARD_TEAM_KEY = "dashboard-team" as const;

export function useDashboardTeam(eventId: string | undefined) {
  return useQuery({
    queryKey: [DASHBOARD_TEAM_KEY, eventId],
    queryFn: (): Promise<TeamResponse> => teamApi.getMyTeam(eventId!),
    enabled: !!eventId,
  });
}
