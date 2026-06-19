import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "@/features/dashboard/services/dashboard.service";

export const DASHBOARD_SUMMARY_KEY = "dashboard-summary" as const;

export function useDashboardSummary() {
  return useQuery({
    queryKey: [DASHBOARD_SUMMARY_KEY],
    queryFn: fetchDashboardSummary,
  });
}
