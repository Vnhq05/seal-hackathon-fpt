"use client";

import Link from "next/link";
import { TeamFilters } from "@/features/teams/components/team-filters";
import { YourTeamSection } from "@/features/teams/components/your-team-section";
import { TeamsGrid } from "@/features/teams/components/teams-grid";

interface TeamsPageProps {
  eventId: string;
}

export function TeamsPage({ eventId }: TeamsPageProps) {
  return (
    <div className="flex min-h-full flex-col">
      <div
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(223,226,236,0.8)",
          padding: "32px 24px 33px",
        }}
      >
        <div className="flex items-center justify-between" style={{ maxWidth: 1280 }}>
          <div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#0e1528",
                letterSpacing: "-0.64px",
                lineHeight: "38.4px",
              }}
            >
              Teams — HackFPT 2025
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#8891a5",
                lineHeight: "21px",
                marginTop: 4,
              }}
            >
              Find teammates or manage your squad for the upcoming hackathon.
            </p>
          </div>

          <Link
            href="/participant/teams"
            className="flex items-center gap-2 rounded-lg"
            style={{
              backgroundColor: "#38bdf8",
              padding: "8px 16px",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.24px",
              lineHeight: "12px",
            }}
          >
            <svg
              width="18"
              height="12"
              viewBox="0 0 18 12"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="6" cy="4" r="2.5" stroke="white" strokeWidth="1.2" />
              <path
                d="M1 11c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M14 3v4M12 5h4"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            Create a team
          </Link>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto"
        style={{ padding: 24 }}
      >
        <div
          className="flex flex-col gap-8"
          style={{ maxWidth: 1280 }}
        >
          <TeamFilters />
          <YourTeamSection eventId={eventId} />
          <TeamsGrid eventId={eventId} />
        </div>
      </div>
    </div>
  );
}
