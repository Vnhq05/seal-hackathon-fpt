import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationApi } from "@/lib/api";
import { PENDING_INVITES_KEY } from "@/features/teams/hooks/use-pending-invites";

export function useCancelInvite(teamId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (inviteId: string) => invitationApi.cancel(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_INVITES_KEY, teamId] });
    },
  });

  return {
    cancelInvite: mutation.mutate,
    isPending: mutation.isPending,
    pendingInviteId: mutation.variables,
  };
}
