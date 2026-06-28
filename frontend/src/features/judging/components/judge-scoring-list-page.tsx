"use client";

import Link from "next/link";
import { useJudgeScoringAssignments } from "@/features/judging/hooks/use-judge-scoring-assignments";
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

export function JudgeScoringListPage() {
  const portalBase = usePortalBase();
  const { data: assignments = [], isLoading } = useJudgeScoringAssignments();

  return (
    <div className="mx-auto max-w-5xl flex flex-col gap-6" style={{ padding: 32 }}>
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">Chấm điểm</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Danh sách team được phân công chấm điểm.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" />
        </div>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-seal-text-muted">Chưa có team nào được phân công.</p>
      ) : (
        <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <table className="w-full text-left">
            <thead className="bg-seal-surface-elevated text-xs font-semibold uppercase tracking-wider text-seal-text-muted">
              <tr>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Round</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={`${a.teamId}-${a.roundId}`} className="border-t border-seal-border">
                  <td className="px-4 py-3 text-sm text-seal-text-secondary">{a.trackName ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-seal-text-secondary">{a.roundName}</td>
                  <td className="px-4 py-3 text-sm font-medium text-seal-text">{a.teamName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[a.scoringStatus]}`}>
                      {STATUS_LABEL[a.scoringStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.submissionId ? (
                      <Link
                        href={`${portalBase}/scoring/${a.teamId}/${a.roundId}`}
                        className="text-xs font-semibold text-royal hover:underline"
                      >
                        {a.scoringStatus === "COMPLETED" || a.scoringStatus === "LOCKED" ? "Xem" : "Chấm"}
                      </Link>
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
    </div>
  );
}
