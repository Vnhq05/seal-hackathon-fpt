import Link from "next/link";
import type { TeamResponse } from "@/lib/api";

interface TeamCardProps {
  team: TeamResponse;
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <div
      className="flex flex-col justify-between rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(223,226,236,0.8)",
        padding: 25,
        filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
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
          </div>
          <span
            className="rounded-md px-2 py-1"
            style={{
              fontSize: 11,
              fontWeight: 500,
              backgroundColor: team.status === "FORMING" ? "#ecfdf5" : "#eef0f6",
              color: team.status === "FORMING" ? "#047857" : "#8891a5",
            }}
          >
            {team.status}
          </span>
        </div>
      </div>

      <div
        className="flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(223,226,236,0.8)", paddingTop: 17 }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5" }}>
            {team.memberCount} members
          </span>
        </div>
        <Link
          href={`/student/teams/${team.id}`}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#38bdf8",
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
