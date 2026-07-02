"use client";

import type { CompetitionOutcome, PublicMatchingProfileResponse } from "@/lib/api/matching.api";
import { formatUniversityDisplay } from "@/lib/university";

const OUTCOME_STYLES: Record<CompetitionOutcome, string> = {
  CHAMPION: "bg-amber-50 text-amber-700 border-amber-200",
  FINALIST: "bg-seal-surface-elevated text-seal-text border-seal-border",
  ELIMINATED: "bg-seal-surface-sunken text-seal-text-muted border-seal-border-light",
  UNRANKED: "bg-seal-surface-sunken text-seal-text-muted border-seal-border-light",
};

const OUTCOME_LABELS: Record<CompetitionOutcome, string> = {
  CHAMPION: "Champion",
  FINALIST: "Finalist",
  ELIMINATED: "Eliminated",
  UNRANKED: "Unranked",
};

function formatSeason(season: string): string {
  if (!season) return "";
  return season.charAt(0) + season.slice(1).toLowerCase();
}

function formatTeamRank(finalRank: number | null): string {
  if (finalRank == null) return "Unranked";
  return `Rank #${finalRank}`;
}

interface PublicProfileModalProps {
  profile: PublicMatchingProfileResponse;
  loading?: boolean;
  error?: Error | null;
  onClose: () => void;
}

export function PublicProfileModal({ profile, loading, error, onClose }: PublicProfileModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-seal-border p-5">
          <div>
            <h2 className="text-xl font-bold text-seal-text">{profile.fullName}</h2>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-seal-text-muted">
              Public profile
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-seal-text-muted hover:bg-seal-surface-elevated">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5 flex flex-col gap-4">
          <div className="border-2 border-navy bg-white p-4 shadow-[2px_2px_0_0_#0c1228]">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">School</dt>
                <dd className="mt-1 text-sm text-seal-text">
                  {formatUniversityDisplay(
                    profile.userType ?? "FPT_STUDENT",
                    profile.universityName,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">Semester</dt>
                <dd className="mt-1 text-sm text-seal-text">
                  {profile.semester != null ? `Semester ${profile.semester}` : "Not provided"}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-seal-text-muted mb-3">
              Past competitions
            </h3>
            {loading && (
              <p className="text-sm text-seal-text-muted">Loading profile...</p>
            )}
            {error && (
              <p className="text-sm text-red-600">
                {error instanceof Error ? error.message : "Failed to load profile"}
              </p>
            )}
            {!loading && !error && profile.competitions.length === 0 && (
              <p className="text-sm text-seal-text-muted">No past competitions yet.</p>
            )}
            {!loading && !error && profile.competitions.length > 0 && (
              <div className="flex flex-col gap-3">
                {profile.competitions.map((item) => (
                  <div
                    key={`${item.eventId}-${item.teamName}`}
                    className="border-2 border-navy bg-white p-4 shadow-[2px_2px_0_0_#0c1228]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-seal-text truncate">{item.eventName}</div>
                        <div className="mt-1 text-xs text-seal-text-muted truncate">
                          {formatSeason(item.season)} {item.year}
                        </div>
                        <div className="mt-2 text-sm text-seal-text">
                          <span className="text-seal-text-muted">Team:</span> {item.teamName}
                        </div>
                        <div className="mt-1 text-sm font-medium text-seal-text">
                          {formatTeamRank(item.finalRank)}
                        </div>
                      </div>
                      <span
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold flex-shrink-0 ${OUTCOME_STYLES[item.outcome]}`}
                      >
                        {OUTCOME_LABELS[item.outcome]}
                      </span>
                    </div>
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
