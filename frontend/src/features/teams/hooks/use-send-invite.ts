import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationApi } from "@/lib/api";
import { PENDING_INVITES_KEY } from "@/features/teams/hooks/use-pending-invites";

export function useSendInvite(teamId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (inviteeEmail: string) =>
      invitationApi.send(teamId, { inviteeEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PENDING_INVITES_KEY, teamId] });
    },
  });

  return {
    sendInvite: mutation.mutate,
    isPending: mutation.isPending,
    pendingEmail: mutation.variables,
  };
}
