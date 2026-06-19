import { useQuery } from "@tanstack/react-query";
import { fetchRoundInfo } from "@/features/submissions/services/submit-project.service";

export const ROUND_INFO_KEY = "round-info" as const;

export function useRoundInfo(hackathonId: string) {
  return useQuery({
    queryKey: [ROUND_INFO_KEY, hackathonId],
    queryFn: () => fetchRoundInfo(hackathonId),
    enabled: !!hackathonId,
  });
}
