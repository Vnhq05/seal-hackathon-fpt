import { useQuery } from "@tanstack/react-query";
import type { MentorSummary } from "@/features/lecturer-mentor/types/mentor.types";

export const MENTOR_SUMMARY_KEY = "mentor-summary" as const;

// TODO: backend endpoint not implemented yet -- /mentor/summary does not exist.
// The backend has no dedicated mentor summary endpoint. Could be composed from
// teamApi + submissionApi.getMentorSubmissions() once eventId/roundId are known.
export function useMentorSummary() {
  return useQuery<MentorSummary>({
    queryKey: [MENTOR_SUMMARY_KEY],
    queryFn: async (): Promise<MentorSummary> => {
      return {
        trackName: "",
        hackathonName: "",
        totalTeams: 0,
        submittedCount: 0,
        currentRound: "",
        deadline: null,
        timeRemaining: null,
      };
    },
  });
}
