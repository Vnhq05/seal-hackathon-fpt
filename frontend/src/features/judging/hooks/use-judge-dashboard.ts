import { useQuery } from "@tanstack/react-query";
import { judgingApi } from "@/lib/api/judging.api";
import type { JudgeScoringAssignment } from "@/lib/api/judging.api";
import type {
  JudgeDashboard,
  AssignedRoundCard,
  ScoringEventSuggestion,
} from "@/features/judging/types/judge.types";

export const JUDGE_DASHBOARD_KEY = "judge-dashboard" as const;

export function isPendingScore(a: JudgeScoringAssignment): boolean {
  if (!a.submissionId) return false;
  if (a.conflictOfInterest || a.scoringAllowed === false) return false;
  return a.scoringStatus !== "COMPLETED" && a.scoringStatus !== "LOCKED";
}

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
      eventId: first.eventId,
    } as AssignedRoundCard;
  });
}

/** One suggestion per event that still has teams this judge has not finished scoring. */
function buildScoringSuggestions(
  assignments: JudgeScoringAssignment[],
): ScoringEventSuggestion[] {
  type Acc = {
    eventId: string;
    eventName: string;
    roundId: string;
    roundName: string;
    remaining: number;
    total: number;
    deadline: string | null;
  };

  const byEvent = new Map<string, Acc>();

  for (const a of assignments) {
    if (!a.eventId || !a.eventName) continue;
    if (!a.submissionId) continue;

    const existing = byEvent.get(a.eventId) ?? {
      eventId: a.eventId,
      eventName: a.eventName,
      roundId: a.roundId,
      roundName: a.roundName,
      remaining: 0,
      total: 0,
      deadline: a.scoringDeadline,
    };

    existing.total += 1;
    if (isPendingScore(a)) {
      existing.remaining += 1;
      // Prefer the nearest open deadline among pending items
      if (
        a.scoringDeadline &&
        (!existing.deadline ||
          new Date(a.scoringDeadline).getTime() < new Date(existing.deadline).getTime())
      ) {
        existing.deadline = a.scoringDeadline;
        existing.roundId = a.roundId;
        existing.roundName = a.roundName;
      }
    }

    byEvent.set(a.eventId, existing);
  }

  return Array.from(byEvent.values())
    .filter((s) => s.remaining > 0)
    .sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      const db = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      return da - db;
    });
}

export function useJudgeDashboard() {
  return useQuery<JudgeDashboard>({
    queryKey: [JUDGE_DASHBOARD_KEY],
    queryFn: async () => {
      const assignments = await judgingApi.getMyAssignments();
      const assignedRounds = groupAssignmentsByRound(assignments);
      const scoringSuggestions = buildScoringSuggestions(assignments);
      const scored = assignments.filter(
        (a) => a.scoringStatus === "COMPLETED" || a.scoringStatus === "LOCKED",
      ).length;
      const remaining = scoringSuggestions.reduce((sum, s) => sum + s.remaining, 0);

      return {
        stats: {
          roundsAssigned: assignedRounds.length,
          totalSubmissions: assignments.length,
          scored,
          remaining,
        },
        assignedRounds,
        scoringSuggestions,
      };
    },
  });
}
