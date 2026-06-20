import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api";

export const HACKATHON_DETAIL_KEY = "hackathon-detail" as const;

export function useHackathonDetail(id: string) {
  return useQuery({
    queryKey: [HACKATHON_DETAIL_KEY, id],
    queryFn: () => eventApi.getById(id),
    enabled: !!id,
  });
}
