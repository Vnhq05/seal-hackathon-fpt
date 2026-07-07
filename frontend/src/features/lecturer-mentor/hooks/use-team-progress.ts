import { useQuery } from "@tanstack/react-query";
import { progressApi } from "@/lib/api/progress.api";

export const TEAM_PROGRESS_KEY = "team-progress" as const;

export function useTeamProgress(eventId?: string) {
  return useQuery({
    queryKey: [TEAM_PROGRESS_KEY, eventId],
    queryFn: () => progressApi.getMentorAtRisk(eventId!),
    enabled: !!eventId,
  });
}
