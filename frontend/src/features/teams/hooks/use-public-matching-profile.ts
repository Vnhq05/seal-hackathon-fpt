import { useQuery } from "@tanstack/react-query";
import { matchingApi } from "@/lib/api/matching.api";

export function usePublicMatchingProfile(
  eventId: string | undefined,
  teamId: string | undefined,
  userId: string | undefined,
  open: boolean,
) {
  return useQuery({
    queryKey: ["public-matching-profile", eventId, teamId, userId],
    queryFn: () => matchingApi.getPublicProfile(eventId!, teamId!, userId!),
    enabled: !!eventId && !!teamId && !!userId && open,
  });
}
