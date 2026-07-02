import { useQuery } from "@tanstack/react-query";
import { matchingApi } from "@/lib/api/matching.api";

export function matchingCandidatesKey(eventId: string, teamId: string) {
  return ["matching-candidates", eventId, teamId] as const;
}

export function useMatchingCandidates(
  eventId: string | undefined,
  teamId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: matchingCandidatesKey(eventId ?? "", teamId ?? ""),
    queryFn: () => matchingApi.getCandidates(eventId!, teamId!),
    enabled: !!eventId && !!teamId && enabled,
  });
}
