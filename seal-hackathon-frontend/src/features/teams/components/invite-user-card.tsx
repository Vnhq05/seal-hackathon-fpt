"use client";

import type { InviteCandidate } from "@/features/teams/types/invite.types";
import { useSendInvite } from "@/features/teams/hooks/use-send-invite";

interface InviteUserCardProps {
  candidate: InviteCandidate;
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

const CARD_STYLES: Record<string, React.CSSProperties> = {
  available: {
    backgroundColor: "#ffffff",
    border: "1px solid rgba(223,226,236,0.8)",
    borderRadius: 8,
    opacity: 1,
  },
  in_team: {
    backgroundColor: "#ffffff",
    border: "1px solid rgba(223,226,236,0.8)",
    borderRadius: 8,
    opacity: 0.6,
  },
  sent: {
    backgroundColor: "rgba(16,185,129,0.05)",
    border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 8,
    opacity: 1,
  },
};

const AVATAR_BG: Record<string, string> = {
  available: "#c5c9d8",
  in_team: "rgba(223,226,236,0.8)",
  sent: "#c5c9d8",
};

export function InviteUserCard({ candidate, teamId }: InviteUserCardProps) {
  const { sendInvite, isPending, pendingUserId } = useSendInvite(teamId);
  const isSending = isPending && pendingUserId === candidate.id;

  return (
    <div
      className="flex items-center justify-between"
      style={{ ...CARD_STYLES[candidate.status], padding: 17 }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{
            width: 40,
            height: 40,
            backgroundColor: AVATAR_BG[candidate.status],
          }}
        >
          {candidate.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={candidate.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span style={{ fontSize: 18, fontWeight: 600, color: candidate.status === "in_team" ? "#8891a5" : "#0e1528" }}>
              {getInitials(candidate.name)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>
            {candidate.name}
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}>
            {candidate.role}
          </span>
        </div>
      </div>

      {candidate.status === "available" && (
        <button
          type="button"
          onClick={() => sendInvite(candidate.id)}
          disabled={isSending}
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
      )}

      {candidate.status === "in_team" && (
        <span
          className="flex flex-shrink-0 items-center gap-1 rounded"
          style={{
            backgroundColor: "rgba(223,226,236,0.8)",
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 500,
            color: "#8891a5",
            letterSpacing: "0.24px",
            lineHeight: "12px",
          }}
        >
          <svg width="9" height="12" viewBox="0 0 9 12" fill="none" aria-hidden="true">
            <rect x="0.5" y="5" width="8" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1" />
            <path d="M2 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          In a team
        </span>
      )}

      {candidate.status === "sent" && (
        <span
          className="flex flex-shrink-0 items-center gap-1 rounded"
          style={{
            backgroundColor: "rgba(16,185,129,0.1)",
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 500,
            color: "#10b981",
            letterSpacing: "0.24px",
            lineHeight: "12px",
          }}
        >
          <svg width="10" height="7" viewBox="0 0 10 7" fill="none" aria-hidden="true">
            <path d="M1 3.5l3 3 5-5.5" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sent
        </span>
      )}
    </div>
  );
}
