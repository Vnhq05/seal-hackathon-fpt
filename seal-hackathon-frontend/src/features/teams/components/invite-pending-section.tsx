"use client";

import { usePendingInvites } from "@/features/teams/hooks/use-pending-invites";
import { InvitePendingItem } from "@/features/teams/components/invite-pending-item";

interface InvitePendingSectionProps {
  teamId: string;
}

export function InvitePendingSection({ teamId }: InvitePendingSectionProps) {
  const { data, isLoading } = usePendingInvites(teamId);
  const invites = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div
          className="animate-pulse rounded"
          style={{ height: 12, width: 140, backgroundColor: "rgba(223,226,236,0.8)" }}
        />
        <div
          className="animate-pulse rounded-lg"
          style={{ height: 48, backgroundColor: "#f5f5f5" }}
        />
      </div>
    );
  }

  if (invites.length === 0) return null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#8891a5",
          letterSpacing: "0.24px",
          lineHeight: "12px",
        }}
      >
        Pending invitations ({invites.length})
      </span>
      <div className="flex flex-col gap-2">
        {invites.map((invite) => (
          <InvitePendingItem key={invite.id} invite={invite} teamId={teamId} />
        ))}
      </div>
    </div>
  );
}
