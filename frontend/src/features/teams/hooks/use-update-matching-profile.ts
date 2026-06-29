import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  enrollmentApi,
  type UpdateMatchingProfileRequest,
} from "@/lib/api/enrollment.api";
import {
  enrollmentMyKey,
  enrollmentWaitingListKey,
} from "@/features/events/hooks/use-enrollment";

export function useUpdateMatchingProfile(eventId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateMatchingProfileRequest) =>
      enrollmentApi.updateMatchingProfile(eventId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentMyKey(eventId) });
      qc.invalidateQueries({ queryKey: enrollmentWaitingListKey(eventId) });
    },
  });
}
