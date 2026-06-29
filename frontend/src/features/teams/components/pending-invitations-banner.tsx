"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationApi } from "@/lib/api";
import type { EventResponse, InvitationResponse } from "@/lib/api";
import { ENROLLMENT_KEY } from "@/features/events/hooks/use-enrollment";
import { TEAM_INVITATION_KEY } from "@/features/teams/hooks/use-team-invitation";
import { JOINABLE_TEAMS_KEY } from "@/features/teams/hooks/use-joinable-teams";
import { useInvitationParticipationGate } from "@/features/teams/hooks/use-invitation-participation-gate";

interface PendingInvitationsBannerProps {
  invitations: InvitationResponse[];
  event?: EventResponse | null;
}

export function PendingInvitationsBanner({ invitations, event }: PendingInvitationsBannerProps) {
  const qc = useQueryClient();
  const { canModifyMembers, registrationClosedReason } = useInvitationParticipationGate(event);
  const pending = invitations.filter((i) => i.status === "PENDING");

  const accept = useMutation({
    mutationFn: (id: string) => invitationApi.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TEAM_INVITATION_KEY] });
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
      qc.invalidateQueries({ queryKey: [ENROLLMENT_KEY] });
      qc.invalidateQueries({ queryKey: [JOINABLE_TEAMS_KEY] });
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) => invitationApi.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TEAM_INVITATION_KEY] });
    },
  });

  if (pending.length === 0) return null;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <p className="text-sm font-semibold text-blue-900">Pending team invitations</p>
      {!canModifyMembers && registrationClosedReason && (
        <p className="mt-1 text-xs text-amber-700">{registrationClosedReason}</p>
      )}
      <div className="mt-2 flex flex-col gap-2">
        {pending.map((inv) => (
          <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/60 px-3 py-2">
            <span className="text-sm text-blue-900">
              Invitation to join <strong>{inv.teamName}</strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => accept.mutate(inv.id)}
                disabled={!canModifyMembers || accept.isPending || reject.isPending}
                className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => reject.mutate(inv.id)}
                disabled={accept.isPending || reject.isPending}
                className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
