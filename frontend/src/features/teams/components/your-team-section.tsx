"use client";

import { useMyTeam } from "@/features/teams/hooks/use-my-teams";

function YourTeamSkeleton() {
  return (
    <div
      className="animate-pulse rounded-lg"
      style={{
        border: "2px solid rgba(99,102,241,0.3)",
        height: 160,
        backgroundColor: "#fafafa",
      }}
    />
  );
}

interface YourTeamSectionProps {
  eventId: string;
}

export function YourTeamSection({ eventId }: YourTeamSectionProps) {
  const { data: team, isLoading } = useMyTeam(eventId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <svg
            width="12"
            height="20"
            viewBox="0 0 12 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 1v12M3 10l3 3 3-3M2 16h8M1 19h10"
              stroke="#0e1528"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#0e1528",
              lineHeight: "25.2px",
            }}
          >
            Your Team
          </h2>
        </div>
        <YourTeamSkeleton />
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <svg
          width="12"
          height="20"
          viewBox="0 0 12 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 1v12M3 10l3 3 3-3M2 16h8M1 19h10"
            stroke="#0e1528"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#0e1528",
            lineHeight: "25.2px",
          }}
        >
          Your Team
        </h2>
      </div>
      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          backgroundColor: "#ffffff",
          border: "2px solid #38bdf8",
          padding: 26,
          boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-1 flex-col gap-1">
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
            <div className="flex items-center gap-4 pt-3">
              <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5" }}>
                {team.memberCount} members
              </span>
              <span
                className="rounded-md px-2 py-1"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: "#eef0f6",
                  color: "#0e1528",
                }}
              >
                {team.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
