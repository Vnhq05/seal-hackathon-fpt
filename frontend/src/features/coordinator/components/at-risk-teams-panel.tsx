"use client";

import Link from "next/link";
import { useActiveEventProgress } from "@/features/dashboard/hooks/use-my-team-progress";
import { progressReasonLabel } from "@/features/progress/lib/progress.utils";

export function AtRiskTeamsPanel() {
  const { data: atRiskTeams = [], isLoading } = useActiveEventProgress();

  if (isLoading) {
    return (
      <div className="mb-6 border-2 border-navy bg-white p-5 shadow-[4px_4px_0_0_#0c1228]">
        <div className="animate-pulse h-24 rounded bg-seal-surface-sunken" />
      </div>
    );
  }

  if (atRiskTeams.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 border-2 border-amber-300 bg-amber-50 shadow-[4px_4px_0_0_#0c1228]">
      <div className="border-b-2 border-amber-200 px-5 py-3">
        <h2 className="font-mono text-lg font-bold text-navy">
          Teams needing support ({atRiskTeams.length})
        </h2>
        <p className="text-sm text-amber-900/80">
          Teams with slow submission progress before the round deadline.
        </p>
      </div>
      <ul className="divide-y divide-amber-200">
        {atRiskTeams.slice(0, 8).map((team) => (
          <li key={`${team.teamId}-${team.roundId}`} className="flex items-center justify-between gap-4 px-5 py-3">
            <div>
              <p className="font-semibold text-navy">{team.teamName}</p>
              <p className="text-xs text-amber-900/70">
                {team.reasons.map(progressReasonLabel).join(" · ")}
                {team.hoursUntilDeadline >= 0 && (
                  <> · {team.hoursUntilDeadline}h to deadline</>
                )}
              </p>
            </div>
            <span
              className="shrink-0 rounded px-2 py-1 text-xs font-bold"
              style={{
                color: team.riskLevel === "CRITICAL" ? "#be123c" : "#b45309",
                backgroundColor: team.riskLevel === "CRITICAL" ? "rgba(225,29,72,0.1)" : "rgba(245,158,11,0.2)",
              }}
            >
              {team.riskLevel === "CRITICAL" ? "Critical" : "At risk"}
            </span>
          </li>
        ))}
      </ul>
      {atRiskTeams.length > 8 && (
        <div className="border-t-2 border-amber-200 px-5 py-2 text-sm">
          <Link href="/coordinator/hackathons" className="font-medium text-navy underline">
            View all hackathons
          </Link>
        </div>
      )}
    </div>
  );
}
