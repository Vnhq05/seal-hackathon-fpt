import { useQueryClient } from "@tanstack/react-query";
import { PENDING_INVITES_KEY } from "@/features/teams/hooks/use-pending-invites";

/**
 * Cancel-invite endpoint does not exist in the backend.
 * This hook is kept as a no-op stub so existing imports do not break.
 * The mutation callback logs a warning and resolves immediately.
 * Remove usages when the UI drops the cancel-invite feature.
 */
export function useCancelInvite(teamId: string) {
  const queryClient = useQueryClient();

  return {
    cancelInvite: (_inviteId: string) => {
      console.warn("[useCancelInvite] No backend endpoint for cancelling invitations.");
      queryClient.invalidateQueries({ queryKey: [PENDING_INVITES_KEY, teamId] });
    },
    isPending: false,
    pendingInviteId: undefined as string | undefined,
  };
}
