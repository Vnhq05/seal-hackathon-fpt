import { useQuery } from "@tanstack/react-query";
import { roundApi } from "@/lib/api";

export function useEventRounds(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-rounds", eventId],
    queryFn: () => roundApi.list(eventId!),
    enabled: !!eventId,
  });
}
