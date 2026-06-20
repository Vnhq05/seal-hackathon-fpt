import { useQuery } from "@tanstack/react-query";
import { roundApi } from "@/lib/api";
import type { RoundResponse } from "@/lib/api";

export const ROUND_INFO_KEY = "round-info" as const;

export function useRoundInfo(eventId: string, roundId?: string) {
  return useQuery({
    queryKey: [ROUND_INFO_KEY, eventId, roundId],
    queryFn: async (): Promise<RoundResponse[]> => {
      if (roundId) {
        const round = await roundApi.getById(eventId, roundId);
        return [round];
      }
      return roundApi.list(eventId);
    },
    enabled: !!eventId,
  });
}
