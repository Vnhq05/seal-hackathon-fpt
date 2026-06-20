import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserApi } from "@/lib/api/admin-user.api";
import type { ApproveRejectPayload } from "@/features/staff/types/staff.types";
import { PENDING_USERS_KEY } from "@/features/staff/hooks/use-pending-users";
import { STAFF_DASHBOARD_KEY } from "@/features/staff/hooks/use-staff-dashboard";

/**
 * Approves or rejects a user using adminUserApi.approveOrReject().
 * Maps from the component's ApproveRejectPayload to the lib/api ApprovalRequest shape.
 */
export function useApproveRejectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApproveRejectPayload) =>
      adminUserApi.approveOrReject({
        userId: payload.userId,
        action: payload.action === "approve" ? "APPROVE" : "REJECT",
        reason: payload.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [STAFF_DASHBOARD_KEY] });
    },
  });
}
