"use client";

import Link from "next/link";
import { useDashboardTeam } from "@/features/dashboard/hooks/use-dashboard-team";
import type { SubmissionStatus } from "@/features/dashboard/types/dashboard.types";

const SUBMISSION_CONFIG: Record<SubmissionStatus, { bg: string; color: string; label: string }> = {
  not_submitted: { bg: "#fef9c3", color: "#a16207", label: "Not submitted" },
  submitted: { bg: "#dbeafe", color: "#1d4ed8", label: "Submitted" },
  reviewed: { bg: "#dcfce7", color: "#15803d", label: "Reviewed" },
};

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
      <p className="mt-1" style={{ fontSize: "12px", color: "rgba(101,217,243,0.2)" }}>
        Join or create a team to get started.
      </p>
      <Link
        href="/participant/teams"
        className="mt-4 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-indigo-50"
        style={{ color: "#38bdf8", border: "1px solid #c4b5fd" }}
      >
        Explore Teams
      </Link>
    </div>
  );
}

export function TeamCard() {
  const { data: team, isLoading } = useDashboardTeam();

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg" style={{ border: "1px solid rgba(223,226,236,0.8)", height: 200, backgroundColor: "#f5f5f5" }} />
    );
  }

  if (!team) return <NoTeamState />;

  const { bg, color, label } = SUBMISSION_CONFIG[team.submissionStatus];
  const memberPercent = Math.round((team.memberCount / team.maxMembers) * 100);

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
          <p className="mt-0.5 truncate" style={{ fontSize: "12px", color: "rgba(101,217,243,0.2)" }}>
            {team.hackathonName}
          </p>
        </div>
        <span
          className="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5"
          style={{ fontSize: "11px", fontWeight: 600, backgroundColor: bg, color }}
        >
          {label}
        </span>
      </div>

      {team.trackName && (
        <p className="mt-2" style={{ fontSize: "12px", color: "#8891a5" }}>
          Track: <strong>{team.trackName}</strong>
        </p>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between" style={{ marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", color: "#8891a5" }}>Members</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#0e1528" }}>
            {team.memberCount} / {team.maxMembers}
          </span>
        </div>
        <div className="w-full rounded-full" style={{ height: 6, backgroundColor: "rgba(223,226,236,0.8)" }}>
          <div
            className="rounded-full"
            style={{ height: 6, width: `${memberPercent}%`, backgroundColor: "#38bdf8", transition: "width 0.3s ease" }}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/participant/teams/${team.id}`}
          className="flex-1 rounded-md py-1.5 text-center text-sm font-medium transition-colors hover:bg-indigo-700"
          style={{ backgroundColor: "#38bdf8", color: "#0e1528" }}
        >
          View Team
        </Link>
        <Link
          href={`/participant/teams/${team.id}`}
          className="flex-1 rounded-md py-1.5 text-center text-sm font-medium transition-colors hover:bg-indigo-50"
          style={{ color: "#38bdf8", border: "1px solid #c4b5fd" }}
        >
          Invite
        </Link>
      </div>
    </div>
  );
}
