"use client";

import type { TeamInvitation } from "@/features/teams/types/team-invitation.types";
import { TrackPinIcon } from "./invitation-icons";
import { InvitationMemberRow } from "./invitation-member-row";
import {
  sectionLabelStyle,
  trackBadgeStyle,
  metaTextStyle,
} from "./invitation-styles";

const cardStyle: React.CSSProperties = {
  backgroundColor: "rgba(223,226,236,0.8)",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: 17,
  position: "relative",
  overflow: "hidden",
};

interface InvitationDetailCardProps {
  invitation: TeamInvitation;
}

export function InvitationDetailCard({
  invitation,
}: InvitationDetailCardProps) {
  const emptySlots = invitation.maxMembers - invitation.memberCount;

  return (
    <div style={cardStyle}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: "#38bdf8",
        }}
      />
      <div className="flex flex-col gap-4">
        {/* Team name + track */}
        <div className="flex flex-col gap-1">
          <h2
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#0e1528",
              letterSpacing: "-0.24px",
              lineHeight: "31.2px",
              margin: 0,
            }}
          >
            {invitation.teamName}
          </h2>
          <div className="flex items-center gap-2">
            <span style={trackBadgeStyle}>
              <TrackPinIcon />
              {invitation.trackName}
            </span>
            <span style={metaTextStyle}>•</span>
            <span style={metaTextStyle}>{invitation.hackathonName}</span>
          </div>
        </div>

        {/* Invited by */}
        <div
          style={{ borderTop: "1px solid rgba(223,226,236,0.8)", paddingTop: 17 }}
          className="flex flex-col gap-1"
        >
          <span style={sectionLabelStyle}>INVITED BY</span>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center overflow-hidden rounded-full"
              style={{
                width: 32,
                height: 32,
                backgroundColor: "rgba(223,226,236,0.8)",
                border: "1px solid rgba(223,226,236,0.8)",
                flexShrink: 0,
              }}
            >
              {invitation.leader.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={invitation.leader.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  style={{ fontSize: 13, fontWeight: 600, color: "#8891a5" }}
                >
                  {invitation.leader.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#0e1528",
                  lineHeight: "17.5px",
                }}
              >
                {invitation.leader.name}
              </span>
              <span style={metaTextStyle}>Team Leader</span>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span style={sectionLabelStyle}>MEMBERS</span>
            <span style={metaTextStyle}>
              {invitation.memberCount} / {invitation.maxMembers} members
            </span>
          </div>
          <InvitationMemberRow
            members={invitation.members}
            emptySlots={emptySlots}
          />
        </div>
      </div>
    </div>
  );
}
