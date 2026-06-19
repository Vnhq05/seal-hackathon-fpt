import { useQuery } from "@tanstack/react-query";
import { fetchStaffDashboard, fetchRecentApprovals } from "@/features/staff/services/staff.service";

export const STAFF_DASHBOARD_KEY = "staff-dashboard" as const;
export const STAFF_RECENT_APPROVALS_KEY = "staff-recent-approvals" as const;

export function useStaffDashboard() {
  return useQuery({
    queryKey: [STAFF_DASHBOARD_KEY],
    queryFn: fetchStaffDashboard,
  });
}

export function useRecentApprovals() {
  return useQuery({
    queryKey: [STAFF_RECENT_APPROVALS_KEY],
    queryFn: fetchRecentApprovals,
  });
}
