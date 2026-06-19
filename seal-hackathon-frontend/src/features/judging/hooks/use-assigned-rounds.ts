import { useQuery } from "@tanstack/react-query";
import { fetchAssignedRounds } from "@/features/judging/services/judge.service";

export const ASSIGNED_ROUNDS_KEY = "judge-assigned-rounds" as const;

export function useAssignedRounds() {
  return useQuery({
    queryKey: [ASSIGNED_ROUNDS_KEY],
    queryFn: fetchAssignedRounds,
  });
}
