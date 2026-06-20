import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RankingListParams, RankingEntry, RankingOverridePayload, PaginatedResponse } from "@/features/staff/types/staff.types";

export const STAFF_RANKINGS_KEY = "staff-rankings" as const;

// TODO: backend endpoint not implemented yet — /staff/rankings does not exist.
// rankingApi.getRankings(roundId) requires a roundId. Staff view lists rankings across
// all rounds, which has no backend equivalent. Returning placeholder data.
export function useStaffRankings(params?: RankingListParams) {
  return useQuery<PaginatedResponse<RankingEntry>>({
    queryKey: [STAFF_RANKINGS_KEY, params],
    queryFn: async (): Promise<PaginatedResponse<RankingEntry>> => {
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: params?.pageSize ?? 10,
        totalPages: 0,
      } as unknown as PaginatedResponse<RankingEntry>;
    },
  });
}

// TODO: backend endpoint not implemented yet — /staff/rankings/override does not exist.
export function useOverrideRankings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_payload: RankingOverridePayload): Promise<void> => {
      console.warn("Override rankings: backend endpoint not implemented yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_RANKINGS_KEY] });
    },
  });
}
