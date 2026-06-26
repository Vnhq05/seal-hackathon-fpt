import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api/public.api";

export const PUBLIC_EVENT_KEY = "public-event" as const;
export const PUBLIC_EVENT_ROUNDS_KEY = "public-event-rounds" as const;

export function usePublicEvent(eventId: string) {
  return useQuery({
    queryKey: [PUBLIC_EVENT_KEY, eventId],
    queryFn: () => publicApi.getEventById(eventId),
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePublicEventRounds(eventId: string) {
  return useQuery({
    queryKey: [PUBLIC_EVENT_ROUNDS_KEY, eventId],
    queryFn: () => publicApi.getRounds(eventId),
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000,
  });
}
