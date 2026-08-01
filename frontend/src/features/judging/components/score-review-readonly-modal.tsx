"use client";

import { useScoreReviewDetail } from "@/features/admin/hooks/use-score-reviews";
import { scoreReviewNoteLabel } from "@/lib/api/score-review.api";

const headerCell: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#8891a5",
  letterSpacing: "0.24px",
  lineHeight: "12px",
  padding: "12px 16px",
  textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14,
  color: "#0e1528",
  lineHeight: "20px",
  padding: "14px 16px",
};

export function ScoreReviewReadonlyModal({
  eventId,
  reviewId,
  onClose,
}: {
  eventId: string;
  reviewId: string;
  onClose: () => void;
}) {
  const { data: review, isLoading } = useScoreReviewDetail(eventId, reviewId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-navy bg-white shadow-[8px_8px_0_0_#0c1228]">
        <div className="flex items-center justify-between border-b border-seal-border p-4">
          <h2 className="text-lg font-bold text-seal-text">Score Deviation Review</h2>
          <button type="button" onClick={onClose} className="text-sm text-seal-text-muted hover:text-seal-text">
            Close
          </button>
        </div>

        {isLoading || !review ? (
          <div className="p-8 text-center text-sm text-seal-text-muted">Loading...</div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Score deviation ≥ 25% of the event scale between judges. A coordinator will resolve this flag.
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-seal-text-muted">Team:</span> {review.teamName}</div>
              <div><span className="text-seal-text-muted">Round:</span> {review.roundType ?? review.roundId}</div>
              <div><span className="text-seal-text-muted">Deviation:</span> {review.deviationValue.toFixed(1)}%</div>
              <div><span className="text-seal-text-muted">Status:</span> {review.status}</div>
            </div>

            {review.resolutionNote?.trim() && (
              <div className={`rounded border px-3 py-2 text-sm ${
                review.status === "REJECTED" || review.status === "IGNORED"
                  ? "border-gray-200 bg-gray-50 text-gray-800"
                  : "border-seal-border bg-seal-surface-sunken text-seal-text"
              }`}>
                <span className="font-medium">{scoreReviewNoteLabel(review.resolvedByRole)}:</span>{" "}
                {review.resolutionNote.trim()}
                {review.resolvedByFullName?.trim() ? (
                  <span className="mt-1 block text-xs text-seal-text-muted">
                    By {review.resolvedByFullName.trim()}
                  </span>
                ) : null}
              </div>
            )}

            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#eef0f6" }}>
                  <th style={headerCell}>Judge</th>
                  <th style={{ ...headerCell, width: 100, whiteSpace: "nowrap" }}>Weighted</th>
                  <th style={{ ...headerCell, width: 100, whiteSpace: "nowrap" }}>% Score</th>
                  <th style={{ ...headerCell, width: 100, whiteSpace: "nowrap" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(review.judgeScores ?? []).map((j) => {
                  const maxPct = Math.max(
                    ...(review.judgeScores ?? []).map((x) => x.percentScore),
                    0,
                  );
                  const gap =
                    j.gapFromMaxPct != null ? j.gapFromMaxPct : maxPct - j.percentScore;
                  const isFlagged = j.flagged === true || gap > 25;
                  return (
                    <tr
                      key={j.judgeUserId}
                      style={{
                        borderTop: "1px solid rgba(198,198,205,0.3)",
                        backgroundColor: isFlagged ? "rgba(254, 226, 226, 0.55)" : undefined,
                      }}
                    >
                      <td style={{ ...bodyCell, fontWeight: 600 }}>
                        {j.judgeFullName ?? j.judgeUserId}
                        {isFlagged ? (
                          <span className="ml-2 text-xs font-semibold text-red-700">flagged</span>
                        ) : null}
                      </td>
                      <td style={bodyCell}>{j.weightedScore.toFixed(2)}</td>
                      <td style={{
                        ...bodyCell,
                        fontWeight: isFlagged ? 700 : undefined,
                        color: isFlagged ? "#b91c1c" : bodyCell.color,
                      }}>
                        {j.percentScore.toFixed(1)}%
                      </td>
                      <td style={bodyCell}>{j.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
