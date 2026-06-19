import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendInvite } from "@/features/teams/services/invite.service";
import { INVITE_SEARCH_KEY } from "@/features/teams/hooks/use-invite-search";
import { PENDING_INVITES_KEY } from "@/features/teams/hooks/use-pending-invites";

export function useSendInvite(teamId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userId: string) => sendInvite({ teamId, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVITE_SEARCH_KEY, teamId] });
      queryClient.invalidateQueries({ queryKey: [PENDING_INVITES_KEY, teamId] });
    },
  });

  return {
    sendInvite: mutation.mutate,
    isPending: mutation.isPending,
    pendingUserId: mutation.variables,
  };
}
