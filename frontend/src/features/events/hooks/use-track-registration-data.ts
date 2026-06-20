import { useQuery } from "@tanstack/react-query";
import type { TrackRegistrationData } from "@/features/events/types/track-registration.types";

export const TRACK_REGISTRATION_KEY = "track-registration" as const;

/**
 * TODO: "Tracks" do not exist in the backend -- they have been replaced by "criteria".
 * This hook previously fetched GET /hackathons/{id}/tracks which is not a valid endpoint.
 * Once the UI is redesigned around criteria, replace this with a criteriaApi call.
 * For now it returns an empty result so consuming components don't crash.
 */
export function useTrackRegistrationData(hackathonId: string) {
  return useQuery({
    queryKey: [TRACK_REGISTRATION_KEY, hackathonId],
    queryFn: async (): Promise<TrackRegistrationData> => {
      // TODO: Replace with criteriaApi call when UI is redesigned for criteria
      // The old endpoint GET /hackathons/{hackathonId}/tracks does not exist.
      return {
        hackathonId,
        hackathonName: "",
        teamId: "",
        teamName: "",
        tracks: [],
      };
    },
    enabled: !!hackathonId,
  });
}
