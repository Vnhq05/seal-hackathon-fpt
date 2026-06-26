import { useQuery } from "@tanstack/react-query";
import { judgingApi } from "@/lib/api/judging.api";

export const JUDGE_ASSIGNMENTS_KEY = "judge-scoring-assignments" as const;

export function useJudgeScoringAssignments() {
  return useQuery({
    queryKey: [JUDGE_ASSIGNMENTS_KEY],
    queryFn: () => judgingApi.getMyAssignments(),
  });
}
