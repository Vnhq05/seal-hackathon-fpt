import { useQuery } from "@tanstack/react-query";
import { fetchRoundSubmissions } from "@/features/judging/services/judge.service";
import type { RoundSubmissionsParams } from "@/features/judging/types/judge.types";

export const ROUND_SUBMISSIONS_KEY = "judge-round-submissions" as const;

export function useRoundSubmissions(
  roundId: string,
  params?: RoundSubmissionsParams,
) {
  return useQuery({
    queryKey: [ROUND_SUBMISSIONS_KEY, roundId, params],
    queryFn: () => fetchRoundSubmissions(roundId, params),
    enabled: !!roundId,
  });
}
