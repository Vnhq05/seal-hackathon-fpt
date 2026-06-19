import { useQuery } from "@tanstack/react-query";
import { fetchHackathons } from "@/features/events/services/hackathon.service";
import type { HackathonListParams } from "@/features/events/types/hackathon.types";

export const HACKATHONS_KEY = "hackathons" as const;

export function useHackathons(params?: HackathonListParams) {
  return useQuery({
    queryKey: [HACKATHONS_KEY, params],
    queryFn: () => fetchHackathons(params),
  });
}
