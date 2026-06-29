import { useQuery } from "@tanstack/react-query";
import { scheduleApi } from "@/lib/api/schedule.api";

export const EVENT_SCHEDULE_KEY = "event-schedule" as const;

export function useEventSchedule(eventId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [EVENT_SCHEDULE_KEY, eventId],
    queryFn: () => scheduleApi.list(eventId!),
    enabled: !!eventId && enabled,
    staleTime: 60_000,
  });
}
