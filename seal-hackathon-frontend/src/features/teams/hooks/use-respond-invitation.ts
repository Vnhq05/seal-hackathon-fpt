"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { respondToInvitation } from "@/features/teams/services/team-invitation.service";
import type {
  InvitationAction,
  RespondInvitationRequest,
} from "@/features/teams/types/team-invitation.types";

export function useRespondInvitation(invitationId: string) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (action: InvitationAction) =>
      respondToInvitation({ invitationId, action }),
    onSuccess: (_data, action) => {
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
