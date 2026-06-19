import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAwards, createAward, updateAward, deleteAward } from "@/features/staff/services/staff.service";
import type { AwardListParams, AwardPayload } from "@/features/staff/types/staff.types";

export const STAFF_AWARDS_KEY = "staff-awards" as const;

export function useStaffAwards(params?: AwardListParams) {
  return useQuery({
    queryKey: [STAFF_AWARDS_KEY, params],
    queryFn: () => fetchAwards(params),
  });
}

export function useCreateAward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_AWARDS_KEY] });
    },
  });
}

export function useUpdateAward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AwardPayload }) => updateAward(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_AWARDS_KEY] });
    },
  });
}

export function useDeleteAward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_AWARDS_KEY] });
    },
  });
}
