import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PromotionRound, PromotableTeam, PromotePayload } from "@/features/staff/types/staff.types";

export const PROMOTION_ROUNDS_KEY = "promotion-rounds" as const;
export const PROMOTABLE_TEAMS_KEY = "promotable-teams" as const;

// TODO: backend endpoint not implemented yet — /staff/promotions/* does not exist.
// Team advancement is handled via rankingApi.getAdvancements(roundId), but the staff
// promotions workflow (manual promote) has no backend equivalent.
export function usePromotionRounds() {
  return useQuery<PromotionRound[]>({
    queryKey: [PROMOTION_ROUNDS_KEY],
    queryFn: async (): Promise<PromotionRound[]> => {
      return [];
    },
  });
}

// TODO: backend endpoint not implemented yet
export function usePromotableTeams(roundId: string | null) {
  return useQuery<PromotableTeam[]>({
    queryKey: [PROMOTABLE_TEAMS_KEY, roundId],
    queryFn: async (): Promise<PromotableTeam[]> => {
      return [];
    },
    enabled: !!roundId,
  });
}

// TODO: backend endpoint not implemented yet
export function usePromoteTeams() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_payload: PromotePayload): Promise<void> => {
      throw new Error("Promote teams: backend endpoint not implemented yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMOTABLE_TEAMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PROMOTION_ROUNDS_KEY] });
    },
  });
}
