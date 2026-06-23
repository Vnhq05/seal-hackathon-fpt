"use client";

import Link from "next/link";
import { useDashboardTeam } from "@/features/dashboard/hooks/use-dashboard-team";
import { useDashboardHackathons } from "@/features/dashboard/hooks/use-dashboard-hackathons";
import type { TeamResponse } from "@/lib/api";

function NoTeamState() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg py-10 text-center"
      style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}
    >
      <div
        className="mb-3 flex items-center justify-center rounded-full"
        style={{ width: 44, height: 44, backgroundColor: "#eef0f6" }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <circle cx="9" cy="7" r="3" stroke="#38bdf8" strokeWidth="1.5" />
          <path d="M3 19c0-3.314 2.686-6 6-6" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 11v6M13 14h6" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p style={{ fontSize: "14px", fontWeight: 600, color: "#0e1528" }}>No team yet</p>
      <p className="mt-1" style={{ fontSize: "12px", color: "#8891a5" }}>
        Join or create a team to get started.
      </p>
      <Link
        href="/student/teams"
        className="mt-4 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-indigo-50"
        style={{ color: "#38bdf8", border: "1px solid #c4b5fd" }}
      >
        Explore Teams
      </Link>
    </div>
  );
}

function TeamCardContent({ team }: { team: TeamResponse }) {
  const statusLabel =
    team.status === "CONFIRMED"
      ? "Confirmed"
      : team.status === "FORMING"
        ? "Forming"
        : team.status === "DISBANDED"
          ? "Disbanded"
          : team.status;

  const statusBg =
    team.status === "CONFIRMED"
      ? "#dcfce7"
      : team.status === "FORMING"
        ? "#dbeafe"
        : "#fef9c3";

  const statusColor =
    team.status === "CONFIRMED"
      ? "#15803d"
      : team.status === "FORMING"
        ? "#1d4ed8"
        : "#a16207";

  return (
    <div className="rounded-lg bg-seal-surface" style={{ border: "1px solid rgba(223,226,236,0.8)", padding: "20px" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className="truncate font-semibold"
            style={{ fontSize: "16px", color: "#0e1528" }}
          >
            {team.name}
          </h3>
        </div>
        <span
          className="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5"
          style={{ fontSize: "11px", fontWeight: 600, backgroundColor: statusBg, color: statusColor }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-3">
        <span style={{ fontSize: "12px", color: "#8891a5" }}>
          {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/student/teams/${team.id}`}
          className="flex-1 rounded-md py-1.5 text-center text-sm font-medium transition-colors hover:bg-indigo-700"
          style={{ backgroundColor: "#38bdf8", color: "#0e1528" }}
        >
          View Team
        </Link>
        <Link
          href={`/student/teams/${team.id}`}
          className="flex-1 rounded-md py-1.5 text-center text-sm font-medium transition-colors hover:bg-indigo-50"
          style={{ color: "#38bdf8", border: "1px solid #c4b5fd" }}
        >
          Invite
        </Link>
      </div>
    </div>
  );
}

export function TeamCard() {
  // Pick the first active hackathon as the eventId context
  const { data: hackathons } = useDashboardHackathons();
  const activeEvent = hackathons?.find((e) => e.status === "ACTIVE");
  const { data: team, isLoading } = useDashboardTeam(activeEvent?.id);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg" style={{ border: "1px solid rgba(223,226,236,0.8)", height: 200, backgroundColor: "#f5f5f5" }} />
    );
  }

  if (!team) return <NoTeamState />;

  return <TeamCardContent team={team} />;
}
