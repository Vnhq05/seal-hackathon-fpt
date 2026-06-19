import { useQuery } from "@tanstack/react-query";
import { fetchJudgeDashboard } from "@/features/judging/services/judge.service";

export const JUDGE_DASHBOARD_KEY = "judge-dashboard" as const;

export function useJudgeDashboard() {
  return useQuery({
    queryKey: [JUDGE_DASHBOARD_KEY],
    queryFn: fetchJudgeDashboard,
  });
}
