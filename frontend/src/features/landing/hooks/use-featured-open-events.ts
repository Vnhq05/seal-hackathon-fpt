import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api/public.api";

// Client-side OPEN filter until backend wires status in listPublicEvents (see EventService.listPublicEvents).
export function useFeaturedOpenEvents() {
  return useQuery({
    queryKey: ["featured-open-events"],
    queryFn: async () => {
      const page = await publicApi.listActiveEvents({ size: 20 });
      return page.content.filter((e) => e.status === "OPEN");
    },
    staleTime: 60_000,
  });
}
