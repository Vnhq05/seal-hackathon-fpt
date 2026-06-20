import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SubmissionListParams, StaffSubmission, PaginatedResponse } from "@/features/staff/types/staff.types";

export const STAFF_SUBMISSIONS_KEY = "staff-submissions" as const;

// TODO: backend endpoint not implemented yet — /staff/submissions does not exist.
// submissionApi.list(roundId) requires a roundId. Staff view lists submissions across
// all rounds, which has no backend equivalent. Returning placeholder data.
export function useStaffSubmissions(params?: SubmissionListParams) {
  return useQuery<PaginatedResponse<StaffSubmission>>({
    queryKey: [STAFF_SUBMISSIONS_KEY, params],
    queryFn: async (): Promise<PaginatedResponse<StaffSubmission>> => {
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: params?.pageSize ?? 10,
        totalPages: 0,
      } as unknown as PaginatedResponse<StaffSubmission>;
    },
  });
}

// TODO: backend endpoint not implemented yet — /staff/submissions/:id/flag does not exist.
export function useFlagSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_submissionId: string): Promise<void> => {
      console.warn("Flag submission: backend endpoint not implemented yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_SUBMISSIONS_KEY] });
    },
  });
}
