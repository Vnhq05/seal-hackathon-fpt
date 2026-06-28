"use client";

import { useState } from "react";
import { useTeamRoundScores, type PastOutcome } from "@/features/teams/hooks/use-team-round-scores";
import type { MyEventTeam } from "@/features/teams/hooks/use-my-teams-all-events";

function TrophyIcon({ highlight }: { highlight?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M5 1h8v5a4 4 0 01-8 0V1z" stroke={highlight ? "#eab308" : "currentColor"} strokeWidth="1.3" />
      <path d="M5 3H2a1 1 0 00-1 1v1a3 3 0 003 3M13 3h3a1 1 0 011 1v1a3 3 0 01-3 3M9 10v3M6 15h6" stroke={highlight ? "#eab308" : "currentColor"} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const OUTCOME_STYLES: Record<PastOutcome, string> = {
  Champion: "bg-amber-50 text-amber-700 border-amber-200",
  Finalist: "bg-seal-surface-elevated text-seal-text border-seal-border",
  Eliminated: "bg-seal-surface-sunken text-seal-text-muted border-seal-border-light",
};

function PastCard({ mt }: { mt: MyEventTeam }) {
  const team = mt.team!;
  const { data } = useTeamRoundScores(mt.event.id, team.id);
  const [open, setOpen] = useState(false);

  const rankText = data?.finalRank ? `Rank #${data.finalRank}` : (data ? "Unranked" : "...");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-4 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-4 text-left transition-colors hover:bg-seal-surface-sunken"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-seal-surface-elevated text-seal-text-muted flex-shrink-0">
          <TrophyIcon highlight={data?.outcome === "Champion"} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-seal-text truncate">{mt.event.name}</div>
          <div className="text-xs text-seal-text-muted mt-0.5 truncate">
            {team.name} — {rankText} — {mt.event.season} {mt.event.year}
          </div>
        </div>
        {data?.outcome && (
          <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold flex-shrink-0 ${OUTCOME_STYLES[data.outcome]}`}>
            {data.outcome}
          </span>
        )}
      </button>

      {open && data && (
        <PastDetailDialog
          mt={mt}
          data={data}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function PastDetailDialog({ mt, data, onClose }: {
  mt: MyEventTeam;
  data: NonNullable<ReturnType<typeof useTeamRoundScores>["data"]>;
  onClose: () => void;
}) {
  const team = mt.team!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-seal-border p-5">
          <div>
            <div className="flex items-center gap-2">
              <TrophyIcon highlight={data.outcome === "Champion"} />
              <h2 className="text-xl font-bold text-seal-text">{mt.event.name}</h2>
            </div>
            <p className="mt-1 text-sm text-seal-text-secondary">
              {team.name}
              {data.finalRank ? ` — Rank #${data.finalRank}` : ""}
              {data.outcome && (
                <span className={`ml-2 rounded-md border px-2 py-0.5 text-xs font-semibold ${OUTCOME_STYLES[data.outcome]}`}>
                  {data.outcome}
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-seal-text-muted hover:bg-seal-surface-elevated">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5 flex flex-col gap-4">
          {/* Members */}
          <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-4">
            <div className="text-[11px] font-medium uppercase tracking-wider text-seal-text-muted mb-2">Members</div>
            {team.members.length === 0 ? (
              <div className="text-sm text-seal-text-muted">—</div>
            ) : (
              <ul className="flex flex-col gap-1">
                {team.members.map((m) => (
                  <li key={m.id} className="text-sm text-seal-text truncate">
                    {m.fullName ?? m.email ?? `User ${m.userId}`}
                    {m.role === "LEADER" && <span className="text-royal ml-1">— Leader</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Round scores */}
          <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-4">
            <div className="text-[11px] font-medium uppercase tracking-wider text-seal-text-muted mb-3">Scores by Round</div>
            {data.roundScores.length === 0 ? (
              <div className="text-sm text-seal-text-muted">No rounds scored yet.</div>
            ) : (
              <div className="divide-y divide-seal-border-light">
                {data.roundScores.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-seal-text">{r.round}</span>
                    <span className="font-medium tabular-nums text-seal-text">{r.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-seal-border p-4">
          <button
            onClick={onClose}
            className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-5 py-2 text-xs font-semibold text-seal-text hover:bg-seal-surface-elevated"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface PastParticipationTabProps {
  pastTeams: MyEventTeam[];
}

export function PastParticipationTab({ pastTeams }: PastParticipationTabProps) {
  if (pastTeams.length === 0) {
    return (
      <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-10 text-center text-sm text-seal-text-muted">
        No past competitions yet. Completed events you joined will appear here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pastTeams.map((mt) => (
        <PastCard key={mt.team!.id} mt={mt} />
      ))}
    </div>
  );
}
