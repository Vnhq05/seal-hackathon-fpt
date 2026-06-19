import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelInvite } from "@/features/teams/services/invite.service";
import { INVITE_SEARCH_KEY } from "@/features/teams/hooks/use-invite-search";
import { PENDING_INVITES_KEY } from "@/features/teams/hooks/use-pending-invites";

export function useCancelInvite(teamId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (inviteId: string) => cancelInvite({ teamId, inviteId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_INVITES_KEY, teamId] });
      queryClient.invalidateQueries({ queryKey: [INVITE_SEARCH_KEY, teamId] });
    },
  });

  return {
    cancelInvite: mutation.mutate,
    isPending: mutation.isPending,
    pendingInviteId: mutation.variables,
  };
}
