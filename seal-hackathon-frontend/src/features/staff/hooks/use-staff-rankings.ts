import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRankings, overrideRankings } from "@/features/staff/services/staff.service";
import type { RankingListParams } from "@/features/staff/types/staff.types";

export const STAFF_RANKINGS_KEY = "staff-rankings" as const;

export function useStaffRankings(params?: RankingListParams) {
  return useQuery({
    queryKey: [STAFF_RANKINGS_KEY, params],
    queryFn: () => fetchRankings(params),
  });
}

export function useOverrideRankings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: overrideRankings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_RANKINGS_KEY] });
    },
  });
}
