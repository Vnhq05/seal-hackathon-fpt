import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AwardListParams, AwardPayload, Award, PaginatedResponse } from "@/features/staff/types/staff.types";

export const STAFF_AWARDS_KEY = "staff-awards" as const;

// TODO: backend endpoint not implemented yet — /staff/awards does not exist.
// No awards feature exists in the current backend.
export function useStaffAwards(params?: AwardListParams) {
  return useQuery<PaginatedResponse<Award>>({
    queryKey: [STAFF_AWARDS_KEY, params],
    queryFn: async (): Promise<PaginatedResponse<Award>> => {
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      } as unknown as PaginatedResponse<Award>;
    },
  });
}

// TODO: backend endpoint not implemented yet
export function useCreateAward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_payload: AwardPayload): Promise<Award> => {
      throw new Error("Create award: backend endpoint not implemented yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_AWARDS_KEY] });
    },
  });
}

// TODO: backend endpoint not implemented yet
export function useUpdateAward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_input: { id: string; payload: AwardPayload }): Promise<Award> => {
      throw new Error("Update award: backend endpoint not implemented yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_AWARDS_KEY] });
    },
  });
}

// TODO: backend endpoint not implemented yet
export function useDeleteAward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string): Promise<void> => {
      throw new Error("Delete award: backend endpoint not implemented yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_AWARDS_KEY] });
    },
  });
}
