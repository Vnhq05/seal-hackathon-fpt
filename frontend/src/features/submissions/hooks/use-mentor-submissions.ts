import { useQuery } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api";

export const MENTOR_SUBMISSIONS_KEY = "mentor-submissions" as const;

export function useMentorSubmissions(
  roundId: string | undefined,
  eventId: string | undefined,
) {
  return useQuery({
    queryKey: [MENTOR_SUBMISSIONS_KEY, roundId, eventId],
    queryFn: () => submissionApi.getMentorSubmissions(roundId!, eventId!),
    enabled: !!roundId && !!eventId,
  });
}
