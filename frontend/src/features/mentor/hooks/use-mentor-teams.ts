import { useQuery } from "@tanstack/react-query";
import type { MentorTeamsParams, MentorTeamsResponse } from "@/features/mentor/types/mentor.types";

export const MENTOR_TEAMS_KEY = "mentor-teams" as const;

// TODO: backend endpoint not implemented yet — /mentor/teams does not exist.
// The backend has teamApi.list(eventId) but no "teams assigned to current mentor" endpoint.
// Replace when a dedicated mentor teams endpoint is available.
export function useMentorTeams(params?: MentorTeamsParams) {
  return useQuery<MentorTeamsResponse>({
    queryKey: [MENTOR_TEAMS_KEY, params],
    queryFn: async (): Promise<MentorTeamsResponse> => {
      return { data: [], total: 0 } as unknown as MentorTeamsResponse;
    },
  });
}
