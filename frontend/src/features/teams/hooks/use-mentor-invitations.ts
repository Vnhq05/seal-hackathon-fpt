import { useQuery } from "@tanstack/react-query";
import { mentorInvitationApi } from "@/lib/api";

export const AVAILABLE_MENTORS_KEY = "available-mentors" as const;

/** Mentors available for invitation in a track's pool. */
export function useAvailableMentors(eventId: string, trackId: string | null | undefined) {
  return useQuery({
    queryKey: [AVAILABLE_MENTORS_KEY, eventId, trackId],
    queryFn: () => mentorInvitationApi.getAvailableMentors(eventId, trackId!),
    enabled: !!eventId && !!trackId,
  });
}
