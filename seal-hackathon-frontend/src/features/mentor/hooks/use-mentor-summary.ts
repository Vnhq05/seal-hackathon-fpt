import { useQuery } from "@tanstack/react-query";
import { fetchMentorSummary } from "@/features/mentor/services/mentor.service";

export const MENTOR_SUMMARY_KEY = "mentor-summary" as const;

export function useMentorSummary() {
  return useQuery({
    queryKey: [MENTOR_SUMMARY_KEY],
    queryFn: fetchMentorSummary,
  });
}
