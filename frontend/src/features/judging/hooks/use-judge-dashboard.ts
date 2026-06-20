import { useQuery } from "@tanstack/react-query";
import { judgingApi } from "@/lib/api/judging.api";
import type { JudgeDashboard } from "@/features/judging/types/judge.types";

export const JUDGE_DASHBOARD_KEY = "judge-dashboard" as const;

// TODO: backend endpoint not implemented yet — /judge/dashboard does not exist.
// Composing a placeholder from available data; replace when a dedicated endpoint is added.
export function useJudgeDashboard() {
  return useQuery<JudgeDashboard>({
    queryKey: [JUDGE_DASHBOARD_KEY],
    queryFn: async (): Promise<JudgeDashboard> => {
      // No dedicated judge dashboard endpoint exists.
      // Return empty placeholder so components don't break.
      return {
        urgency: null,
        stats: { roundsAssigned: 0, totalSubmissions: 0, scored: 0, remaining: 0 },
        assignedRounds: [],
        recentActivity: [],
      };
    },
  });
}
