import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchParticipants, deactivateParticipant } from "@/features/staff/services/staff.service";
import type { ParticipantListParams } from "@/features/staff/types/staff.types";

export const STAFF_PARTICIPANTS_KEY = "staff-participants" as const;

export function useStaffParticipants(params?: ParticipantListParams) {
  return useQuery({
    queryKey: [STAFF_PARTICIPANTS_KEY, params],
    queryFn: () => fetchParticipants(params),
  });
}

export function useDeactivateParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_PARTICIPANTS_KEY] });
    },
  });
}
