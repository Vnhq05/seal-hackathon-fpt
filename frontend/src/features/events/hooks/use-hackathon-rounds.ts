import { useQuery } from "@tanstack/react-query";
import { roundApi } from "@/lib/api";

export const HACKATHON_ROUNDS_KEY = "hackathon-rounds" as const;

export function useHackathonRounds(eventId: string) {
  return useQuery({
    queryKey: [HACKATHON_ROUNDS_KEY, eventId],
    queryFn: () => roundApi.list(eventId),
    enabled: !!eventId,
  });
}
