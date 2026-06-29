import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api/public.api";
import { FEATURED_EVENT } from "@/lib/landing-data";

export function useFeaturedSealEvent() {
  return useQuery({
    queryKey: ["featured-seal-event"],
    queryFn: async () => {
      try {
        const page = await publicApi.listActiveEvents({ size: 20 });
        const spring2026 = page.content.filter(
          (e) => e.season === "SPRING" && e.year === 2026,
        );
        const pool = spring2026.length > 0 ? spring2026 : page.content;
        const seal = pool.find((e) => e.competitionFormat === "SEAL_RAG_2026");
        if (seal) {
          return { eventId: seal.id, fromApi: true as const };
        }
        const any = pool[0];
        if (any) return { eventId: any.id, fromApi: true as const };
      } catch {
        /* fallback */
      }
      return { eventId: String(FEATURED_EVENT.id), fromApi: false as const };
    },
    staleTime: 60_000,
  });
}
