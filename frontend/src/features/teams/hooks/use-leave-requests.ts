import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leaveRequestApi } from "@/lib/api/leave-request.api";

export const TEAM_LEAVE_REQUESTS_KEY = "team-leave-requests" as const;

export function useTeamLeaveRequests(eventId: string, teamId: string, enabled = true) {
  return useQuery({
    queryKey: [TEAM_LEAVE_REQUESTS_KEY, teamId],
    queryFn: () => leaveRequestApi.getTeamRequests(eventId, teamId),
    enabled: !!eventId && !!teamId && enabled,
  });
}

export function useLeaveRequestMutations(eventId: string, teamId: string) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
    qc.invalidateQueries({ queryKey: [TEAM_LEAVE_REQUESTS_KEY, teamId] });
    qc.invalidateQueries({ queryKey: ["waiting-list", eventId] });
  };

  const create = useMutation({
    mutationFn: (reason?: string) =>
      leaveRequestApi.create(eventId, teamId, reason ? { reason } : undefined),
    onSuccess: invalidate,
  });

  return { create };
}
