"use client";

import { useState } from "react";
import { useTeamDetail } from "@/features/teams/hooks/use-team-detail";
import { InviteDrawer } from "@/features/teams/components/invite-drawer";
import { TeamDetailBreadcrumb } from "@/features/teams/components/team-detail-breadcrumb";
import type { TeamResponse } from "@/lib/api";

interface TeamDetailPageProps {
  eventId: string;
  teamId: string;
}

function SkeletonBlock({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse rounded-lg"
      style={{ height, backgroundColor: "rgba(223,226,236,0.8)" }}
    />
  );
}

export function TeamDetailPage({ eventId, teamId }: TeamDetailPageProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { data: team, isLoading } = useTeamDetail(eventId, teamId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6" style={{ maxWidth: 1440 }}>
        <SkeletonBlock height={20} />
        <SkeletonBlock height={120} />
        <div className="grid gap-6 pt-2" style={{ gridTemplateColumns: "2fr 1fr" }}>
          <SkeletonBlock height={500} />
          <div className="flex flex-col gap-6">
            <SkeletonBlock height={220} />
            <SkeletonBlock height={300} />
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>Team not found</p>
        <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
          You don&apos;t have access to this team.
        </p>
      </div>
    );
  }

  const leader = team.members.find((m) => m.role === "LEADER");

  return (
    <>
      <div className="flex flex-col gap-4 overflow-auto p-6" style={{ maxWidth: 1440 }}>
        <TeamDetailBreadcrumb
          hackathonName={team.eventId}
          teamName={team.name}
        />

        {/* Team header */}
        <div
          className="flex items-center justify-between rounded-lg"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid rgba(223,226,236,0.8)",
            padding: 25,
            filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
          }}
        >
          <div className="flex flex-col gap-2">
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#0e1528",
                letterSpacing: "-0.8px",
                lineHeight: "38.4px",
              }}
            >
              {team.name}
            </h1>
            <div className="flex items-center gap-2">
              <span
                className="flex items-center gap-1 rounded-full"
                style={{
                  backgroundColor: "#e1e2ed",
                  border: "1px solid #c4c6d1",
                  padding: "5px 13px",
                  fontSize: 12,
                  color: "#191b24",
                  letterSpacing: "0.24px",
                  lineHeight: "12px",
                }}
              >
                <span
                  className="rounded-full"
                  style={{ width: 8, height: 8, backgroundColor: "#191b24" }}
                />
                {team.status}
              </span>
            </div>
          </div>

          {leader && (
            <div
              className="flex items-center gap-4 rounded-lg"
              style={{
                backgroundColor: "#eef0f6",
                border: "1px solid rgba(223,226,236,0.8)",
                padding: "9px 17px",
              }}
            >
              <div className="flex flex-col gap-1">
                <span
                  style={{
                    fontSize: 12,
                    color: "#8891a5",
                    letterSpacing: "0.6px",
                    textTransform: "uppercase",
                    lineHeight: "12px",
                  }}
                >
                  TEAM LEADER
                </span>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#0e1528",
                    lineHeight: "25.2px",
                  }}
                >
                  {leader.fullName ?? leader.email ?? "Unknown"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Members roster */}
        <div
          className="rounded-lg"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid rgba(223,226,236,0.8)",
            padding: 25,
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>
              Members ({team.memberCount})
            </h2>
            <button
              type="button"
              onClick={() => setIsInviteOpen(true)}
              style={{
                backgroundColor: "#38bdf8",
                border: "none",
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Invite member
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {team.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg p-3"
                style={{ backgroundColor: "#eef0f6" }}>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#c5c9d8" }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>
                    {(m.fullName ?? m.email ?? "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#0e1528" }}>
                    {m.fullName ?? m.email ?? "Unknown"}
                  </span>
                  <span style={{ fontSize: 12, color: "#8891a5" }}>{m.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <InviteDrawer
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        team={{
          id: team.id,
          name: team.name,
          description: "",
          hackathonId: team.eventId,
          hackathonName: team.eventId,
          memberCount: team.memberCount,
          maxMembers: 5,
          trackName: null,
          status: "open",
          members: team.members.map((m) => ({
            id: m.id,
            name: m.fullName ?? m.email ?? "Unknown",
            avatarUrl: null,
            role: m.role,
          })),
        }}
      />
    </>
  );
}
