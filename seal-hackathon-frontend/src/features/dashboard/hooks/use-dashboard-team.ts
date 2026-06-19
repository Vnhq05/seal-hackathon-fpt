import { useQuery } from "@tanstack/react-query";
import { fetchDashboardTeam } from "@/features/dashboard/services/dashboard.service";

export const DASHBOARD_TEAM_KEY = "dashboard-team" as const;

export function useDashboardTeam() {
  return useQuery({
    queryKey: [DASHBOARD_TEAM_KEY],
    queryFn: fetchDashboardTeam,
  });
}
