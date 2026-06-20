import { useQuery } from "@tanstack/react-query";
import { teamApi } from "@/lib/api/team.api";
import type { MentorTeamDetailResponse } from "@/features/mentor/types/mentor.types";

export const MENTOR_TEAM_DETAIL_KEY = "mentor-team-detail" as const;

// TODO: backend endpoint not implemented yet — /mentor/teams/:teamId does not exist.
// teamApi.getById(eventId, teamId) requires an eventId which this hook doesn't have.
// Returning a placeholder. Once eventId is available in the component context,
// switch to teamApi.getById().
export function useMentorTeamDetail(teamId: string) {
  return useQuery<MentorTeamDetailResponse>({
    queryKey: [MENTOR_TEAM_DETAIL_KEY, teamId],
    queryFn: async (): Promise<MentorTeamDetailResponse> => {
      return {
        id: teamId,
        name: "",
        members: [],
        submissions: [],
        notes: "",
      } as unknown as MentorTeamDetailResponse;
    },
    enabled: !!teamId,
  });
}
