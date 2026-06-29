"use client";

import { useScoreReviewDetail } from "@/features/admin/hooks/use-score-reviews";

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
              The system detected a score deviation of ≥ 25 points between judges. A coordinator will resolve this flag.
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-seal-text-muted">Team:</span> {review.teamName}</div>
              <div><span className="text-seal-text-muted">Round:</span> {review.roundType ?? review.roundId}</div>
              <div><span className="text-seal-text-muted">Deviation:</span> {review.deviationValue.toFixed(1)} pts</div>
              <div><span className="text-seal-text-muted">Range:</span> {review.minJudgeScore.toFixed(1)} – {review.maxJudgeScore.toFixed(1)}</div>
            </div>

            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#eef0f6" }}>
                  <th style={headerCell}>Judge</th>
                  <th style={{ ...headerCell, width: 100 }}>Weighted</th>
                  <th style={{ ...headerCell, width: 100 }}>% Score</th>
                  <th style={{ ...headerCell, width: 100 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(review.judgeScores ?? []).map((j) => (
                  <tr key={j.judgeUserId} style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
                    <td style={{ ...bodyCell, fontWeight: 600 }}>{j.judgeFullName ?? j.judgeUserId}</td>
                    <td style={bodyCell}>{j.weightedScore.toFixed(2)}</td>
                    <td style={bodyCell}>{j.percentScore.toFixed(1)}</td>
                    <td style={bodyCell}>{j.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
