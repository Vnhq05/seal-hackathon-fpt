import { useQuery } from "@tanstack/react-query";
import { fetchMentorActivities } from "@/features/mentor/services/mentor.service";

export const MENTOR_ACTIVITIES_KEY = "mentor-activities" as const;

export function useMentorActivities() {
  return useQuery({
    queryKey: [MENTOR_ACTIVITIES_KEY],
    queryFn: fetchMentorActivities,
  });
}
