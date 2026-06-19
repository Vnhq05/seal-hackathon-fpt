"use client";

import { useMyTeam } from "@/features/teams/hooks/use-my-teams";
import { YourTeamCard } from "@/features/teams/components/your-team-card";

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

export function YourTeamSection() {
  const { data, isLoading } = useMyTeam();
  const team = data?.data ?? null;

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
      <YourTeamCard team={team} />
    </div>
  );
}
