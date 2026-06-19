"use client";

import type { PendingInvite } from "@/features/teams/types/invite.types";
import { useCancelInvite } from "@/features/teams/hooks/use-cancel-invite";

interface InvitePendingItemProps {
  invite: PendingInvite;
  teamId: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(sentAt: string): string {
  const diffMs = Date.now() - new Date(sentAt).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "Sent just now";
  if (hours < 24) return `Sent ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Sent yesterday";
  return `Sent ${days}d ago`;
}

export function InvitePendingItem({ invite, teamId }: InvitePendingItemProps) {
  const { cancelInvite, isPending, pendingInviteId } = useCancelInvite(teamId);
  const isCancelling = isPending && pendingInviteId === invite.id;

  return (
    <div
      className="flex items-center justify-between"
      style={{
        borderBottom: invite.status === "pending" ? "1px solid rgba(198,198,205,0.5)" : undefined,
        padding: "8px 0 9px",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex flex-shrink-0 items-center justify-center rounded-full"
          style={{
            width: 32,
            height: 32,
            backgroundColor: "rgba(223,226,236,0.8)",
            fontSize: 12,
            fontWeight: 500,
            color: "#8891a5",
            letterSpacing: "0.24px",
            textTransform: "uppercase",
          }}
        >
          {getInitials(invite.name)}
        </div>
        <div className="flex flex-col gap-0.5">
          <span style={{ fontSize: 14, fontWeight: 500, color: "#0e1528", lineHeight: "21px" }}>
            {invite.name}
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(101,217,243,0.2)", letterSpacing: "0.24px", lineHeight: "12px" }}>
            {formatTimeAgo(invite.sentAt)}
          </span>
        </div>
      </div>

      {invite.status === "pending" && (
        <div className="flex items-center gap-4">
          <span
            className="rounded"
            style={{
              backgroundColor: "#dcfce7",
              padding: "2px 8px",
              fontSize: 12,
              fontWeight: 500,
              color: "#8891a5",
              letterSpacing: "0.24px",
              lineHeight: "12px",
            }}
          >
            Pending
          </span>
          <button
            type="button"
            onClick={() => cancelInvite(invite.id)}
            disabled={isCancelling}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 12,
              fontWeight: 500,
              color: "#ba1a1a",
              letterSpacing: "0.24px",
              lineHeight: "12px",
              cursor: isCancelling ? "default" : "pointer",
              opacity: isCancelling ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {invite.status === "declined" && (
        <span
          className="rounded"
          style={{
            backgroundColor: "rgba(244,63,94,0.1)",
            padding: "2px 8px",
            fontSize: 12,
            fontWeight: 500,
            color: "#f43f5e",
            letterSpacing: "0.24px",
            lineHeight: "12px",
          }}
        >
          Declined
        </span>
      )}
    </div>
  );
}
