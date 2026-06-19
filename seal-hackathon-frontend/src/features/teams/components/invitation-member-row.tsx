"use client";

import type { TeamInvitation } from "@/features/teams/types/team-invitation.types";
import { PersonPlaceholderIcon } from "./invitation-icons";

const AVATAR_SIZE = 40;
const OVERLAP = -12;

interface InvitationMemberRowProps {
  members: TeamInvitation["members"];
  emptySlots: number;
}

export function InvitationMemberRow({
  members,
  emptySlots,
}: InvitationMemberRowProps) {
  const emptySlotArray = Array.from({ length: Math.max(0, emptySlots) });

  return (
    <div className="flex items-center" style={{ height: AVATAR_SIZE }}>
      {members.map((member, i) => (
        <div
          key={member.id}
          className="relative overflow-hidden rounded-full"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            border: "2px solid white",
            backgroundColor: "rgba(223,226,236,0.8)",
            marginLeft: i > 0 ? OVERLAP : 0,
            zIndex: members.length - i + emptySlotArray.length,
          }}
          title={member.name}
        >
          {member.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ fontSize: 14, fontWeight: 700, color: "#0ea5e9" }}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ))}

      {emptySlotArray.map((_, i) => (
        <div
          key={`empty-${i}`}
          className="flex items-center justify-center rounded-full"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            border: "2px dashed rgba(223,226,236,0.8)",
            backgroundColor: "#eef0f6",
            marginLeft: i === 0 && members.length > 0 ? 8 : i > 0 ? 8 : 0,
            padding: 2,
          }}
        >
          <PersonPlaceholderIcon />
        </div>
      ))}
    </div>
  );
}
