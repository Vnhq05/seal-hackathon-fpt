"use client";

import Link from "next/link";
import { useMentorTeamDetail } from "@/features/mentor/hooks/use-mentor-team-detail";
import { MentorTeamDetailHeader } from "@/features/mentor/components/mentor-team-detail-header";
import { MentorTeamMembers } from "@/features/mentor/components/mentor-team-members";
import { MentorRoundCard } from "@/features/mentor/components/mentor-round-card";

function BackArrow() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M9 5.5H2M5 2L2 5.5 5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="4" height="7" viewBox="0 0 4 7" fill="none" aria-hidden="true">
      <path d="M1 1l2 2.5L1 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-8" style={{ padding: 24 }}>
      <div className="animate-pulse rounded-lg" style={{ height: 120, backgroundColor: "rgba(223,226,236,0.8)" }} />
      <div className="grid grid-cols-3 gap-6">
        <div className="animate-pulse rounded-lg" style={{ height: 400, backgroundColor: "rgba(223,226,236,0.8)" }} />
        <div className="col-span-2 flex flex-col gap-4">
          <div className="animate-pulse rounded-lg" style={{ height: 200, backgroundColor: "rgba(223,226,236,0.8)" }} />
          <div className="animate-pulse rounded-lg" style={{ height: 180, backgroundColor: "rgba(223,226,236,0.8)" }} />
        </div>
      </div>
    </div>
  );
}

interface Props {
  teamId: string;
}

export function MentorTeamDetailPage({ teamId }: Props) {
  const { data, isLoading } = useMentorTeamDetail(teamId);

  if (isLoading) return <PageSkeleton />;

  const team = data?.data;
  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>Team not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8" style={{ padding: 24, maxWidth: 1440 }}>
      <div className="flex flex-col gap-2">
        <Link
          href="/mentor/teams"
          className="flex items-center gap-1"
          style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px" }}
        >
          <BackArrow />
          Back to teams
        </Link>
        <div className="flex items-center gap-1" style={{ fontSize: 12, letterSpacing: "0.24px" }}>
          <span style={{ fontWeight: 500, color: "#8891a5" }}>My Track</span>
          <ChevronRight />
          <span style={{ fontWeight: 500, color: "#8891a5" }}>Teams</span>
          <ChevronRight />
          <span style={{ fontWeight: 600, color: "#0e1528" }}>{team.name}</span>
        </div>
      </div>

      <MentorTeamDetailHeader team={team} />

      <div className="grid grid-cols-3 gap-6">
        <div>
          <MentorTeamMembers
            members={team.members}
            memberCount={team.memberCount}
            maxMembers={team.maxMembers}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-4">
          {team.rounds.map((round) => (
            <MentorRoundCard key={round.id} round={round} />
          ))}
        </div>
      </div>
    </div>
  );
}
