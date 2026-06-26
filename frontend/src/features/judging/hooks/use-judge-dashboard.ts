import { useQuery } from "@tanstack/react-query";
import { judgingApi } from "@/lib/api/judging.api";
import type { JudgeDashboard, AssignedRoundCard } from "@/features/judging/types/judge.types";

export const JUDGE_DASHBOARD_KEY = "judge-dashboard" as const;

function groupAssignmentsByRound(
  assignments: Awaited<ReturnType<typeof judgingApi.getMyAssignments>>,
): AssignedRoundCard[] {
  const byRound = new Map<string, typeof assignments>();
  for (const a of assignments) {
    const list = byRound.get(a.roundId) ?? [];
    list.push(a);
    byRound.set(a.roundId, list);
  }

  return Array.from(byRound.entries()).map(([roundId, items]) => {
    const first = items[0];
    const scored = items.filter(
      (i) => i.scoringStatus === "COMPLETED" || i.scoringStatus === "LOCKED",
    ).length;
    const deadline = first.scoringDeadline ?? "";
    const isClosed = deadline ? new Date(deadline) < new Date() : false;

    return {
      id: roundId,
      hackathonName: first.eventName ?? "",
      roundName: first.roundName ?? "",
      deadline,
      scored,
      total: items.length,
      status: isClosed ? "closed" : "open",
    } as AssignedRoundCard;
  });
}

export function useJudgeDashboard() {
  return useQuery<JudgeDashboard>({
    queryKey: [JUDGE_DASHBOARD_KEY],
    queryFn: async () => {
      const assignments = await judgingApi.getMyAssignments();
      const assignedRounds = groupAssignmentsByRound(assignments);
      const scored = assignments.filter(
        (a) => a.scoringStatus === "COMPLETED" || a.scoringStatus === "LOCKED",
      ).length;

      const urgentRound = assignedRounds
        .filter((r) => r.scored < r.total && r.status === "open")
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];

      return {
        urgency: urgentRound
          ? {
              message: `Complete scoring for ${urgentRound.roundName}`,
              remainingHours: Math.max(
                0,
                Math.round(
                  (new Date(urgentRound.deadline).getTime() - Date.now()) / (1000 * 60 * 60),
                ),
              ),
              remainingSubmissions: urgentRound.total - urgentRound.scored,
              roundId: urgentRound.id,
            }
          : null,
        stats: {
          roundsAssigned: assignedRounds.length,
          totalSubmissions: assignments.length,
          scored,
          remaining: assignments.length - scored,
        },
        assignedRounds,
        recentActivity: [],
      };
    },
  });
}
