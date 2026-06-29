"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useJudgeScoringAssignments } from "@/features/judging/hooks/use-judge-scoring-assignments";
import { ScoreReviewReadonlyModal } from "@/features/judging/components/score-review-readonly-modal";
import { usePortalBase } from "@/shared/hooks/use-portal-base";
import type { JudgeScoringAssignment } from "@/lib/api/judging.api";

const STATUS_LABEL: Record<JudgeScoringAssignment["scoringStatus"], string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  LOCKED: "Locked",
};

const STATUS_STYLE: Record<JudgeScoringAssignment["scoringStatus"], string> = {
  NOT_STARTED: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-sky-50 text-sky-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  LOCKED: "bg-gray-100 text-gray-600",
};

type FilterTab = "all" | "pending" | "completed" | "conflict";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Needs scoring" },
  { key: "completed", label: "Completed" },
  { key: "conflict", label: "Conflict" },
];

function conflictMessage(reason: string | null | undefined): string {
  if (reason === "MENTOR_OF_TEAM") {
    return "You are a mentor for this team";
  }
  return reason ?? "Conflict of interest";
}

function matchesFilter(a: JudgeScoringAssignment, filter: FilterTab): boolean {
  if (filter === "all") return true;
  if (filter === "conflict") return !!a.conflictOfInterest;
  if (filter === "completed") {
    return !a.conflictOfInterest
      && (a.scoringStatus === "COMPLETED" || a.scoringStatus === "LOCKED");
  }
  return !a.conflictOfInterest
    && (a.scoringStatus === "NOT_STARTED" || a.scoringStatus === "IN_PROGRESS");
}

export function JudgeScoringListPage() {
  const portalBase = usePortalBase();
  const { data: assignments = [], isLoading } = useJudgeScoringAssignments();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [reviewModal, setReviewModal] = useState<{ eventId: string; reviewId: string } | null>(null);

  const filtered = useMemo(
    () => assignments.filter((a) => matchesFilter(a, filter)),
    [assignments, filter],
  );

  return (
    <div className="mx-auto max-w-5xl flex flex-col gap-6" style={{ padding: 32 }}>
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">Scoring</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Teams assigned to you for scoring.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              filter === tab.key
                ? "bg-navy text-white"
                : "border border-seal-border bg-white text-seal-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-seal-text-muted">No teams match this filter.</p>
      ) : (
        <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <table className="w-full text-left">
            <thead className="bg-seal-surface-elevated text-xs font-semibold uppercase tracking-wider text-seal-text-muted">
              <tr>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Round</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Deviation</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={`${a.teamId}-${a.roundId}`} className="border-t border-seal-border">
                  <td className="px-4 py-3 text-sm text-seal-text-secondary">{a.trackName ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-seal-text-secondary">{a.roundName}</td>
                  <td className="px-4 py-3 text-sm font-medium text-seal-text">{a.teamName}</td>
                  <td className="px-4 py-3">
                    {a.conflictOfInterest ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 w-fit">
                          Conflict of interest
                        </span>
                        <span className="text-xs text-red-600">
                          {conflictMessage(a.conflictReason)}
                        </span>
                      </div>
                    ) : (
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.scoringStatus]}`}>
                        {STATUS_LABEL[a.scoringStatus]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.hasOpenScoreReview ? (
                      <div className="flex flex-col gap-1">
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 w-fit">
                          Deviation flag
                        </span>
                        {a.eventId && a.openScoreReviewId && (
                          <button
                            type="button"
                            onClick={() => setReviewModal({ eventId: a.eventId!, reviewId: a.openScoreReviewId! })}
                            className="text-left text-xs font-semibold text-royal hover:underline"
                          >
                            View details
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-seal-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.submissionId && !a.conflictOfInterest ? (
                      <Link
                        href={`${portalBase}/scoring/${a.teamId}/${a.roundId}`}
                        className="text-xs font-semibold text-royal hover:underline"
                      >
                        {a.scoringStatus === "COMPLETED" || a.scoringStatus === "LOCKED" ? "View" : "Score"}
                      </Link>
                    ) : a.conflictOfInterest ? (
                      <span className="text-xs text-red-600">Cannot score</span>
                    ) : (
                      <span className="text-xs text-seal-text-muted">Not submitted</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reviewModal && (
        <ScoreReviewReadonlyModal
          eventId={reviewModal.eventId}
          reviewId={reviewModal.reviewId}
          onClose={() => setReviewModal(null)}
        />
      )}
    </div>
  );
}
