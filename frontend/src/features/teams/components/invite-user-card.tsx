"use client";

import type { UserSearchResult } from "@/lib/api/user.api";
import { useSendInvite } from "@/features/teams/hooks/use-send-invite";

interface InviteUserCardProps {
  candidate: UserSearchResult;
  teamId: string;
  registrationClosed?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  opacity: 1,
};

export function InviteUserCard({
  candidate,
  teamId,
  registrationClosed = false,
}: InviteUserCardProps) {
  const { sendInvite, isPending, pendingEmail } = useSendInvite(teamId);
  const isSending = isPending && pendingEmail === candidate.email;

  return (
    <div
      className="flex items-center justify-between"
      style={{ ...cardStyle, padding: 17 }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{
            width: 40,
            height: 40,
            backgroundColor: "#c5c9d8",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>
            {getInitials(candidate.fullName)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>
            {candidate.fullName}
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}>
            {candidate.email}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => sendInvite(candidate.email)}
        disabled={isSending || registrationClosed}
        className="flex-shrink-0"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid rgba(223,226,236,0.8)",
          borderRadius: 4,
          padding: "7px 13px",
          fontSize: 12,
          fontWeight: 500,
          color: "#0ea5e9",
          letterSpacing: "0.24px",
          lineHeight: "12px",
          cursor: isSending ? "default" : "pointer",
          opacity: isSending ? 0.5 : 1,
        }}
      >
        {isSending ? "Sending..." : "Send invite"}
      </button>
    </div>
  );
}
