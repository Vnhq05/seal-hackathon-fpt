import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPromotionRounds,
  fetchPromotableTeams,
  promoteTeams,
} from "@/features/staff/services/staff.service";

export const PROMOTION_ROUNDS_KEY = "promotion-rounds" as const;
export const PROMOTABLE_TEAMS_KEY = "promotable-teams" as const;

export function usePromotionRounds() {
  return useQuery({
    queryKey: [PROMOTION_ROUNDS_KEY],
    queryFn: fetchPromotionRounds,
  });
}

export function usePromotableTeams(roundId: string | null) {
  return useQuery({
    queryKey: [PROMOTABLE_TEAMS_KEY, roundId],
    queryFn: () => fetchPromotableTeams(roundId!),
    enabled: !!roundId,
  });
}

export function usePromoteTeams() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: promoteTeams,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMOTABLE_TEAMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PROMOTION_ROUNDS_KEY] });
    },
  });
}
