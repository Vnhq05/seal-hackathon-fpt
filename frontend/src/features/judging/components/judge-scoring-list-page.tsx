"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useJudgeScoringAssignments } from "@/features/judging/hooks/use-judge-scoring-assignments";
import { ScoreReviewReadonlyModal } from "@/features/judging/components/score-review-readonly-modal";
import { usePortalBase } from "@/shared/hooks/use-portal-base";
import type { JudgeScoringAssignment } from "@/lib/api/judging.api";

const STATUS_LABEL: Record<JudgeScoringAssignment["scoringStatus"], string> = {
  NOT_STARTED: "Chưa chấm",
  IN_PROGRESS: "Đang chấm",
  COMPLETED: "Hoàn tất",
  LOCKED: "Đã khóa",
};

const STATUS_STYLE: Record<JudgeScoringAssignment["scoringStatus"], string> = {
  NOT_STARTED: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-sky-50 text-sky-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  LOCKED: "bg-gray-100 text-gray-600",
};

type FilterTab = "all" | "pending" | "completed" | "conflict";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Cần chấm" },
  { key: "completed", label: "Hoàn tất" },
  { key: "conflict", label: "Xung đột" },
];

function conflictMessage(reason: string | null | undefined): string {
  if (reason === "MENTOR_OF_TEAM") {
    return "Bạn là mentor của team này";
  }
  return reason ?? "Xung đột lợi ích";
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
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">Chấm điểm</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Danh sách team được phân công chấm điểm.
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
        <p className="text-sm text-seal-text-muted">Không có team nào trong bộ lọc này.</p>
      ) : (
        <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <table className="w-full text-left">
            <thead className="bg-seal-surface-elevated text-xs font-semibold uppercase tracking-wider text-seal-text-muted">
              <tr>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Round</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Trạng thái</th>
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
                          Xung đột lợi ích
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
                            Xem chi tiết
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
                        {a.scoringStatus === "COMPLETED" || a.scoringStatus === "LOCKED" ? "Xem" : "Chấm"}
                      </Link>
                    ) : a.conflictOfInterest ? (
                      <span className="text-xs text-red-600">Không thể chấm</span>
                    ) : (
                      <span className="text-xs text-seal-text-muted">Chưa nộp</span>
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
