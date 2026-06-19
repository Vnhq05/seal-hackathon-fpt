import { useQuery } from "@tanstack/react-query";
import { fetchHackathonDetail } from "@/features/events/services/hackathon.service";

export const HACKATHON_PAGE_KEY = "hackathon-page" as const;

export function useHackathonPage(id: string) {
  return useQuery({
    queryKey: [HACKATHON_PAGE_KEY, id],
    queryFn: () => fetchHackathonDetail(id),
    enabled: !!id,
  });
}
