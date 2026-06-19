import { useQuery } from "@tanstack/react-query";
import { fetchMentorTeamDetail } from "@/features/mentor/services/mentor.service";

export const MENTOR_TEAM_DETAIL_KEY = "mentor-team-detail" as const;

export function useMentorTeamDetail(teamId: string) {
  return useQuery({
    queryKey: [MENTOR_TEAM_DETAIL_KEY, teamId],
    queryFn: () => fetchMentorTeamDetail(teamId),
    enabled: !!teamId,
  });
}
