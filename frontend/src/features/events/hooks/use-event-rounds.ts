import { useQuery } from "@tanstack/react-query";
import { roundApi } from "@/lib/api";

export const EVENT_ROUNDS_KEY = "event-rounds" as const;

export function useEventRounds(eventId: string | undefined) {
  return useQuery({
    queryKey: [EVENT_ROUNDS_KEY, eventId],
    queryFn: () => roundApi.list(eventId!),
    enabled: !!eventId,
  });
}
