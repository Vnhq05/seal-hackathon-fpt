"use client";

import type { InvitationResponse } from "@/lib/api";
import {
  sectionLabelStyle,
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
  invitation: InvitationResponse;
}

export function InvitationDetailCard({
  invitation,
}: InvitationDetailCardProps) {
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
        {/* Team name */}
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
        </div>

        {/* Invitation details */}
        <div
          style={{ borderTop: "1px solid rgba(223,226,236,0.8)", paddingTop: 17 }}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span style={sectionLabelStyle}>STATUS</span>
            <span style={metaTextStyle}>{invitation.status}</span>
          </div>
          {invitation.expiresAt && (
            <div className="flex items-center justify-between">
              <span style={sectionLabelStyle}>EXPIRES</span>
              <span style={metaTextStyle}>
                {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
