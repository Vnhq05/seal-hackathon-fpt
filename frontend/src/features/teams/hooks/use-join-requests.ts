import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { joinRequestApi } from "@/lib/api/join-request.api";
import { JOINABLE_TEAMS_KEY } from "@/features/teams/hooks/use-joinable-teams";

export const TEAM_JOIN_REQUESTS_KEY = "team-join-requests" as const;
export const MY_JOIN_REQUESTS_KEY = "my-join-requests" as const;

export function useTeamJoinRequests(eventId: string, teamId: string, enabled = true) {
  return useQuery({
    queryKey: [TEAM_JOIN_REQUESTS_KEY, teamId],
    queryFn: () => joinRequestApi.getTeamRequests(eventId, teamId),
    enabled: !!eventId && !!teamId && enabled,
  });
}

export function useMyJoinRequests(eventId: string) {
  return useQuery({
    queryKey: [MY_JOIN_REQUESTS_KEY, eventId],
    queryFn: () => joinRequestApi.getMyRequests(eventId),
    enabled: !!eventId,
  });
}

export function useJoinRequestMutations(eventId: string, teamId?: string) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
    qc.invalidateQueries({ queryKey: [JOINABLE_TEAMS_KEY, eventId] });
    qc.invalidateQueries({ queryKey: [MY_JOIN_REQUESTS_KEY, eventId] });
    if (teamId) {
      qc.invalidateQueries({ queryKey: [TEAM_JOIN_REQUESTS_KEY, teamId] });
    }
    qc.invalidateQueries({ queryKey: ["waiting-list", eventId] });
  };

  const create = useMutation({
    mutationFn: (params: { teamId: string; message?: string }) =>
      joinRequestApi.create(eventId, params.teamId, params.message ? { message: params.message } : undefined),
    onSuccess: invalidate,
  });

  const accept = useMutation({
    mutationFn: (joinRequestId: string) => joinRequestApi.accept(eventId, joinRequestId),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: (joinRequestId: string) => joinRequestApi.reject(eventId, joinRequestId),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: (joinRequestId: string) => joinRequestApi.cancel(eventId, joinRequestId),
    onSuccess: invalidate,
  });

  return { create, accept, reject, cancel };
}
