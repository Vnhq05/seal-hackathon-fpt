import Link from "next/link";
import type { Team } from "@/features/teams/types/team.types";
import { TeamStatusBadge } from "@/features/teams/components/team-status-badge";
import { TeamAvatarStack } from "@/features/teams/components/team-avatar-stack";
import { TeamTrackBadge } from "@/features/teams/components/team-track-badge";
import { TeamMemberCount } from "@/features/teams/components/team-member-count";

interface YourTeamCardProps {
  team: Team;
}

export function YourTeamCard({ team }: YourTeamCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: "2px solid #38bdf8",
        padding: 26,
        boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
      }}
    >
      <div
        className="absolute right-0 top-0"
        style={{
          width: 128,
          height: 128,
          borderBottomLeftRadius: 9999,
          backgroundColor: "#38bdf8",
          opacity: 0.05,
        }}
      />

      <div className="flex items-center justify-between">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "#0e1528",
                letterSpacing: "-0.24px",
                lineHeight: "31.2px",
              }}
            >
              {team.name}
            </h3>
            <TeamStatusBadge status={team.status} />
          </div>

          <p
            className="max-w-[672px]"
            style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}
          >
            {team.description}
          </p>

          <div className="flex items-center gap-4 pt-3">
            {team.trackName && <TeamTrackBadge trackName={team.trackName} />}
            <TeamMemberCount current={team.memberCount} max={team.maxMembers} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <TeamAvatarStack
            members={team.members}
            size={40}
            maxVisible={3}
            totalCount={team.memberCount}
          />
          <Link
            href={`/student/teams/${team.id}`}
            className="rounded-lg text-center"
            style={{
              backgroundColor: "#eef0f6",
              border: "1px solid rgba(223,226,236,0.8)",
              padding: 9,
              fontSize: 12,
              fontWeight: 500,
              color: "#38bdf8",
              letterSpacing: "0.24px",
              lineHeight: "12px",
            }}
          >
            Manage Team
          </Link>
        </div>
      </div>
    </div>
  );
}
