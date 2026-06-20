import { useQuery } from "@tanstack/react-query";
import { adminUserApi } from "@/lib/api/admin-user.api";
import { eventApi } from "@/lib/api/event.api";
import type { StaffDashboardSummary, RecentApproval } from "@/features/staff/types/staff.types";

export const STAFF_DASHBOARD_KEY = "staff-dashboard" as const;
export const STAFF_RECENT_APPROVALS_KEY = "staff-recent-approvals" as const;

// TODO: backend endpoint not implemented yet — /staff/dashboard does not exist.
// Composing partial data from adminUserApi.countPending() and eventApi.list().
export function useStaffDashboard() {
  return useQuery<StaffDashboardSummary>({
    queryKey: [STAFF_DASHBOARD_KEY],
    queryFn: async (): Promise<StaffDashboardSummary> => {
      const [pendingCount, events] = await Promise.all([
        adminUserApi.countPending().catch(() => 0),
        eventApi.list({ page: 0, size: 1 }).catch(() => ({ totalElements: 0 })),
      ]);
      return {
        pendingApprovals: pendingCount,
        activeHackathons: (events as { totalElements: number }).totalElements ?? 0,
        totalParticipants: 0,
        totalTeams: 0,
        totalSubmissions: 0,
      } as unknown as StaffDashboardSummary;
    },
  });
}

// TODO: backend endpoint not implemented yet — /staff/dashboard/recent-approvals does not exist.
export function useRecentApprovals() {
  return useQuery<RecentApproval[]>({
    queryKey: [STAFF_RECENT_APPROVALS_KEY],
    queryFn: async (): Promise<RecentApproval[]> => {
      return [];
    },
  });
}
