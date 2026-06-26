import { useQuery } from "@tanstack/react-query";
import { coordinatorUserApi } from "@/lib/api/coordinator-user.api";
import { eventApi } from "@/lib/api/event.api";
import type { StaffDashboardSummary, RecentApproval } from "@/features/coordinator/types/staff.types";

export const STAFF_DASHBOARD_KEY = "staff-dashboard" as const;
export const STAFF_RECENT_APPROVALS_KEY = "staff-recent-approvals" as const;

export function useStaffDashboard() {
  return useQuery<StaffDashboardSummary>({
    queryKey: [STAFF_DASHBOARD_KEY],
    queryFn: async (): Promise<StaffDashboardSummary> => {
      const [pendingCount, activeEvents, participants] = await Promise.all([
        coordinatorUserApi.countPending().catch(() => 0),
        eventApi.list({ page: 0, size: 1, status: "ACTIVE" }).catch(() => ({ totalElements: 0 })),
        coordinatorUserApi
          .listUsers({ page: 0, size: 1, status: "ACTIVE" })
          .catch(() => ({ totalElements: 0 })),
      ]);
      return {
        pendingApprovals: pendingCount,
        activeHackathons: (activeEvents as { totalElements: number }).totalElements ?? 0,
        totalParticipants: (participants as { totalElements: number }).totalElements ?? 0,
        totalTeams: 0,
        totalSubmissions: 0,
      } as unknown as StaffDashboardSummary;
    },
  });
}

export function useRecentApprovals() {
  return useQuery<RecentApproval[]>({
    queryKey: [STAFF_RECENT_APPROVALS_KEY],
    queryFn: async (): Promise<RecentApproval[]> => {
      const page = await coordinatorUserApi.getPendingAccounts({ page: 0, size: 5 });
      return page.content.map((u) => ({
        id: u.id,
        name: u.fullName,
        initials: u.fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        role: u.userType.replace(/_/g, " "),
        detail: u.email,
      })) as RecentApproval[];
    },
  });
}
