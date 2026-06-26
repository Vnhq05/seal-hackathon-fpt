import { useMutation, useQueryClient } from "@tanstack/react-query";
import { coordinatorUserApi } from "@/lib/api/coordinator-user.api";
import type { ApproveRejectPayload } from "@/features/coordinator/types/staff.types";
import { PENDING_USERS_KEY } from "@/features/coordinator/hooks/use-pending-users";
import { STAFF_DASHBOARD_KEY } from "@/features/coordinator/hooks/use-staff-dashboard";

export function useApproveRejectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ApproveRejectPayload) => {
      if (payload.action === "approve") {
        return coordinatorUserApi.approveUser(payload.userId);
      }
      return coordinatorUserApi.rejectUser(payload.userId, {
        reason: payload.reason ?? "Rejected by coordinator",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [STAFF_DASHBOARD_KEY] });
    },
  });
}
