import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { FEATURED_EVENT } from "@/lib/landing-data";

export function useFeaturedSealEvent() {
  return useQuery({
    queryKey: ["featured-seal-event"],
    queryFn: async () => {
      try {
        const page = await eventApi.list({ season: "SPRING", year: 2026, size: 5 });
        const seal = page.content.find((e) => e.competitionFormat === "SEAL_RAG_2026");
        if (seal) {
          return { eventId: seal.id, fromApi: true as const };
        }
        const any = page.content[0];
        if (any) return { eventId: any.id, fromApi: true as const };
      } catch {
        /* fallback */
      }
      return { eventId: String(FEATURED_EVENT.id), fromApi: false as const };
    },
    staleTime: 60_000,
  });
}
