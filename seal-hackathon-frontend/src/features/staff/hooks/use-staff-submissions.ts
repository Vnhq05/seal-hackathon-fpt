import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchStaffSubmissions, flagSubmission } from "@/features/staff/services/staff.service";
import type { SubmissionListParams } from "@/features/staff/types/staff.types";

export const STAFF_SUBMISSIONS_KEY = "staff-submissions" as const;

export function useStaffSubmissions(params?: SubmissionListParams) {
  return useQuery({
    queryKey: [STAFF_SUBMISSIONS_KEY, params],
    queryFn: () => fetchStaffSubmissions(params),
  });
}

export function useFlagSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: flagSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_SUBMISSIONS_KEY] });
    },
  });
}
