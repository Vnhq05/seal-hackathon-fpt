import { useQuery } from "@tanstack/react-query";
import { fetchTrackRegistrationData } from "@/features/events/services/track-registration.service";

export const TRACK_REGISTRATION_KEY = "track-registration" as const;

export function useTrackRegistrationData(hackathonId: string) {
  return useQuery({
    queryKey: [TRACK_REGISTRATION_KEY, hackathonId],
    queryFn: () => fetchTrackRegistrationData(hackathonId),
    enabled: !!hackathonId,
  });
}
