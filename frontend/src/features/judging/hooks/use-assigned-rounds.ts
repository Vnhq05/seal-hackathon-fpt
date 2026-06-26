import { useQuery } from "@tanstack/react-query";
import { judgingApi } from "@/lib/api/judging.api";
import type { AssignedRoundsResponse, AssignedRound } from "@/features/judging/types/judge.types";

export const ASSIGNED_ROUNDS_KEY = "judge-assigned-rounds" as const;

export function useAssignedRounds() {
  return useQuery<AssignedRoundsResponse>({
    queryKey: [ASSIGNED_ROUNDS_KEY],
    queryFn: async (): Promise<AssignedRoundsResponse> => {
      const assignments = await judgingApi.getMyAssignments();
      const byRound = new Map<string, typeof assignments>();

      for (const a of assignments) {
        const list = byRound.get(a.roundId) ?? [];
        list.push(a);
        byRound.set(a.roundId, list);
      }

      const data: AssignedRound[] = Array.from(byRound.entries()).map(([roundId, items]) => {
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
          status: isClosed ? "closed" : "open",
          deadline,
          criteria: [],
          scored,
          total: items.length,
        };
      });

      return { data };
    },
  });
}
