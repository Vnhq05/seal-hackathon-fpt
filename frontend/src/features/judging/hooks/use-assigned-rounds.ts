import { useQuery } from "@tanstack/react-query";
import type { AssignedRoundsResponse } from "@/features/judging/types/judge.types";

export const ASSIGNED_ROUNDS_KEY = "judge-assigned-rounds" as const;

// TODO: backend endpoint not implemented yet — /judge/rounds does not exist.
// The backend has assignmentApi.listJudges(eventId, roundId) but no endpoint
// that returns "rounds assigned to the current judge". Replace when available.
export function useAssignedRounds() {
  return useQuery<AssignedRoundsResponse>({
    queryKey: [ASSIGNED_ROUNDS_KEY],
    queryFn: async (): Promise<AssignedRoundsResponse> => {
      return { data: [] };
    },
  });
}
