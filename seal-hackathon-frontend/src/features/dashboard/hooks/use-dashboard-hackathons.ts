import { useQuery } from "@tanstack/react-query";
import { fetchDashboardHackathons } from "@/features/dashboard/services/dashboard.service";

export const DASHBOARD_HACKATHONS_KEY = "dashboard-hackathons" as const;

export function useDashboardHackathons() {
  return useQuery({
    queryKey: [DASHBOARD_HACKATHONS_KEY],
    queryFn: fetchDashboardHackathons,
  });
}
