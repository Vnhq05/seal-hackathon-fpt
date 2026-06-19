import Link from "next/link";
import type { Team } from "@/features/teams/types/team.types";
import { TeamStatusBadge } from "@/features/teams/components/team-status-badge";
import { TeamAvatarStack } from "@/features/teams/components/team-avatar-stack";
import { TeamTrackBadge } from "@/features/teams/components/team-track-badge";
import { TeamMemberCount } from "@/features/teams/components/team-member-count";

interface TeamCardProps {
  team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
  const isFull = team.status === "full";

  return (
    <div
      className="flex flex-col justify-between rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(223,226,236,0.8)",
        padding: 25,
        filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
        opacity: isFull ? 0.8 : 1,
      }}
    >
      <div style={{ paddingBottom: 8 }}>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h3
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#0e1528",
                lineHeight: "25.2px",
              }}
            >
              {team.name}
            </h3>
            {team.trackName && <TeamTrackBadge trackName={team.trackName} />}
          </div>
          <TeamStatusBadge status={team.status} />
        </div>
      </div>

      <div style={{ paddingBottom: 16 }}>
        <p
          className="line-clamp-2"
          style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}
        >
          {team.description}
        </p>
      </div>

      <div
        className="flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(223,226,236,0.8)", paddingTop: 17 }}
      >
        <div className="flex items-center gap-2">
          <TeamAvatarStack members={team.members} size={32} maxVisible={4} />
          <TeamMemberCount current={team.memberCount} max={team.maxMembers} />
        </div>
        <Link
          href={`/participant/teams/${team.id}`}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: isFull ? "#8891a5" : "#38bdf8",
            letterSpacing: "0.24px",
            lineHeight: "12px",
          }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
