import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveRejectUser } from "@/features/staff/services/staff.service";
import { PENDING_USERS_KEY } from "@/features/staff/hooks/use-pending-users";
import { STAFF_DASHBOARD_KEY } from "@/features/staff/hooks/use-staff-dashboard";

export function useApproveRejectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveRejectUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [STAFF_DASHBOARD_KEY] });
    },
  });
}
