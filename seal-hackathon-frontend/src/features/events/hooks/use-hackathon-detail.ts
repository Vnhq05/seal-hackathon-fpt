import { useQuery } from "@tanstack/react-query";
import { fetchHackathonDetail } from "@/features/events/services/hackathon-registration.service";

export const HACKATHON_DETAIL_KEY = "hackathon-detail" as const;

export function useHackathonDetail(id: string) {
  return useQuery({
    queryKey: [HACKATHON_DETAIL_KEY, id],
    queryFn: () => fetchHackathonDetail(id),
    enabled: !!id,
  });
}
