import { useQuery } from "@tanstack/react-query";
import { fetchMentorTeams } from "@/features/mentor/services/mentor.service";
import type { MentorTeamsParams } from "@/features/mentor/types/mentor.types";

export const MENTOR_TEAMS_KEY = "mentor-teams" as const;

export function useMentorTeams(params?: MentorTeamsParams) {
  return useQuery({
    queryKey: [MENTOR_TEAMS_KEY, params],
    queryFn: () => fetchMentorTeams(params),
  });
}
