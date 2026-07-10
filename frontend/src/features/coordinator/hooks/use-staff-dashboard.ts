import { useQuery } from "@tanstack/react-query";
import { coordinatorUserApi } from "@/lib/api/coordinator-user.api";
import { eventApi } from "@/lib/api/event.api";
import { progressApi } from "@/lib/api/progress.api";
import { roundApi } from "@/lib/api/round.api";
import { findCurrentRound } from "@/features/lecturer-mentor/lib/mentor-team-mappers";
import type { StaffDashboardSummary, RecentApproval } from "@/features/coordinator/types/staff.types";

export const STAFF_DASHBOARD_KEY = "staff-dashboard" as const;
export const STAFF_RECENT_APPROVALS_KEY = "staff-recent-approvals" as const;

async function aggregateActiveEventProgress() {
  const events = await eventApi.list({ page: 0, size: 5, status: "ACTIVE" }).catch(() => ({
    content: [] as { id: string }[],
  }));

  let activeTeams = 0;
  let totalSubmissions = 0;
  let flaggedTeams = 0;

  for (const event of events.content) {
    try {
      const rounds = await roundApi.list(event.id);
      const currentRound = findCurrentRound(rounds);
      if (!currentRound) continue;
      const roundProgress = await progressApi.getByRound(event.id, currentRound.id);
      activeTeams += roundProgress.length;
      totalSubmissions += roundProgress.filter((p) => p.totalVersions > 0).length;
      flaggedTeams += roundProgress.filter(
        (p) => p.riskLevel !== "OK" && p.hoursUntilDeadline >= 0,
      ).length;
    } catch {
      // ignore per-event failures on dashboard aggregate
    }
  }

  return { activeTeams, totalSubmissions, flaggedTeams };
}

export function useStaffDashboard() {
  return useQuery<StaffDashboardSummary>({
    queryKey: [STAFF_DASHBOARD_KEY],
    queryFn: async (): Promise<StaffDashboardSummary> => {
      const [pendingCount, activeEvents, participants, progressStats] = await Promise.all([
        coordinatorUserApi.countPending().catch(() => 0),
        eventApi.list({ page: 0, size: 1, status: "ACTIVE" }).catch(() => ({ totalElements: 0 })),
        coordinatorUserApi
          .listUsers({ page: 0, size: 1, status: "ACTIVE" })
          .catch(() => ({ totalElements: 0 })),
        aggregateActiveEventProgress(),
      ]);

      return {
        pendingApprovals: pendingCount,
        activeHackathons: (activeEvents as { totalElements: number }).totalElements ?? 0,
        totalParticipants: (participants as { totalElements: number }).totalElements ?? 0,
        activeTeams: progressStats.activeTeams,
        totalSubmissions: progressStats.totalSubmissions,
        pendingSubmissions: 0,
        registeredCount: (participants as { totalElements: number }).totalElements ?? 0,
        activeJudges: 0,
        nextDeadlineDays: null,
        totalSubmissionSlots: progressStats.activeTeams,
        flaggedTeams: progressStats.flaggedTeams,
        timelinePhase: "hacking",
      };
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
