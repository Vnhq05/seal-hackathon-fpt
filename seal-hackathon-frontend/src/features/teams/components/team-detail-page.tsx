"use client";

import { useState } from "react";
import { useTeamDetail } from "@/features/teams/hooks/use-team-detail";
import { InviteDrawer } from "@/features/teams/components/invite-drawer";
import { TeamDetailBreadcrumb } from "@/features/teams/components/team-detail-breadcrumb";
import { TeamDetailHeader } from "@/features/teams/components/team-detail-header";
import { TeamDetailRoster } from "@/features/teams/components/team-detail-roster";
import { TeamDetailRanking } from "@/features/teams/components/team-detail-ranking";
import { TeamDetailTrack } from "@/features/teams/components/team-detail-track";

interface TeamDetailPageProps {
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

export function TeamDetailPage({ teamId }: TeamDetailPageProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { data, isLoading } = useTeamDetail(teamId);
  const team = data?.data ?? null;

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

  return (
    <>
      <div className="flex flex-col gap-4 overflow-auto p-6" style={{ maxWidth: 1440 }}>
        <TeamDetailBreadcrumb
          hackathonName={team.hackathonName}
          teamName={team.name}
        />

        <TeamDetailHeader team={team} />

        <div className="grid gap-6 pt-2" style={{ gridTemplateColumns: "2fr 1fr" }}>
          <TeamDetailRoster team={team} onInvite={() => setIsInviteOpen(true)} />
          <div className="flex flex-col gap-6">
            <TeamDetailRanking ranking={team.ranking} />
            <TeamDetailTrack track={team.track} rounds={team.rounds} />
          </div>
        </div>
      </div>

      <InviteDrawer
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        team={{
          id: team.id,
          name: team.name,
          description: team.description,
          hackathonId: team.hackathonId,
          hackathonName: team.hackathonName,
          memberCount: team.memberCount,
          maxMembers: team.maxMembers,
          trackName: team.track.name,
          status: team.memberCount >= team.maxMembers ? "full" : "open",
          members: team.members.map((m) => ({
            id: m.id,
            name: m.name,
            avatarUrl: m.avatarUrl,
            role: m.role,
          })),
        }}
      />
    </>
  );
}
