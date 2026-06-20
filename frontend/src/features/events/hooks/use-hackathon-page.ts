import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api";

export const HACKATHON_PAGE_KEY = "hackathon-page" as const;

export function useHackathonPage(id: string) {
  return useQuery({
    queryKey: [HACKATHON_PAGE_KEY, id],
    queryFn: () => eventApi.getById(id),
    enabled: !!id,
  });
}
