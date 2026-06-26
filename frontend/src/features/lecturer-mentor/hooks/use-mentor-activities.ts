import { useQuery } from "@tanstack/react-query";
import type { MentorActivitiesResponse } from "@/features/lecturer-mentor/types/mentor.types";

export const MENTOR_ACTIVITIES_KEY = "mentor-activities" as const;

// TODO: backend endpoint not implemented yet — /mentor/activities does not exist.
// No equivalent endpoint exists in the current backend.
export function useMentorActivities() {
  return useQuery<MentorActivitiesResponse>({
    queryKey: [MENTOR_ACTIVITIES_KEY],
    queryFn: async (): Promise<MentorActivitiesResponse> => {
      return { data: [] } as unknown as MentorActivitiesResponse;
    },
  });
}
