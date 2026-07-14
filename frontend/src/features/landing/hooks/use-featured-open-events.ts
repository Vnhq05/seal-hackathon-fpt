import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api/public.api";
import type { EventResponse } from "@/lib/api/event.api";

async function fetchAllOpenEvents(): Promise<EventResponse[]> {
  const pageSize = 50;
  let page = 0;
  let last = false;
  const events: EventResponse[] = [];

  while (!last) {
    const result = await publicApi.listActiveEvents({
      status: "OPEN",
      page,
      size: pageSize,
    });
    events.push(...result.content);
    last = result.last || result.content.length === 0;
    page += 1;
    if (page > 100) break;
  }

  return events.filter((e) => e.status === "OPEN");
}

export function useFeaturedOpenEvents() {
  return useQuery({
    queryKey: ["featured-open-events"],
    queryFn: fetchAllOpenEvents,
    staleTime: 60_000,
  });
}
