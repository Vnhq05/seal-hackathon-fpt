"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { invitationApi } from "@/lib/api";
import { TEAM_INVITATION_KEY } from "@/features/teams/hooks/use-team-invitation";

/**
 * Accepts "accept", "reject", and the legacy "decline" (mapped to "reject")
 * so existing UI code that passes "decline" keeps working.
 */
export type InvitationAction = "accept" | "reject" | "decline";

export function useRespondInvitation(invitationId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (action: InvitationAction) => {
      if (action === "accept") {
        return invitationApi.accept(invitationId);
      }
      // "decline" is the legacy name; map it to "reject"
      return invitationApi.reject(invitationId);
    },
    onSuccess: (_data, action) => {
      queryClient.invalidateQueries({ queryKey: [TEAM_INVITATION_KEY] });
      if (action === "accept") {
        router.push("/participant/teams");
      } else {
        router.push("/participant");
      }
    },
  });

  return {
    respond: (action: InvitationAction) => mutation.mutate(action),
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
