"use client";

import { useState } from "react";
import { useAdminEvents } from "@/features/admin/hooks/use-admin-hackathons";
import {
  useResolveScoreReview,
  useScoreReviewDetail,
  useScoreReviews,
} from "@/features/admin/hooks/use-score-reviews";
import type { ScoreReviewResponse, ScoreReviewStatus } from "@/lib/api/score-review.api";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

const inputStyle: React.CSSProperties = {
  padding: "8px 12px", fontSize: 14, border: "1px solid rgba(198,198,205,0.5)",
  borderRadius: 8, minWidth: 220,
};

function StatusBadge({ status }: { status: ScoreReviewStatus }) {
  const styles: Record<ScoreReviewStatus, string> = {
    OPEN: "bg-amber-50 text-amber-800",
    RESOLVED: "bg-emerald-50 text-emerald-800",
    IGNORED: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function ReviewDetailModal({
  eventId,
  reviewId,
  onClose,
}: {
  eventId: string;
  reviewId: string;
  onClose: () => void;
}) {
  const { data: review, isLoading } = useScoreReviewDetail(eventId, reviewId);
  const { mutate: resolve, isPending } = useResolveScoreReview(eventId);
  const [note, setNote] = useState("");

  const handleResolve = (status: "RESOLVED" | "IGNORED") => {
    resolve(
      { reviewId, body: { status, resolutionNote: note.trim() || undefined } },
      { onSuccess: onClose },
    );
  };

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

            {review.status === "OPEN" && (
              <div className="flex flex-col gap-3 border-t border-seal-border pt-4">
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Resolution note (optional)"
                  className="w-full rounded border border-seal-border px-3 py-2 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleResolve("IGNORED")}
                    className="border-2 border-navy bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Ignore
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleResolve("RESOLVED")}
                    className="border-2 border-navy bg-seal-yellow px-4 py-2 text-sm font-bold text-navy disabled:opacity-50"
                  >
                    Mark resolved
                  </button>
                </div>
              </div>
            )}

            {review.resolutionNote && (
              <p className="text-sm text-seal-text-secondary">
                <span className="font-medium">Note:</span> {review.resolutionNote}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({
  review,
  onSelect,
}: {
  review: ScoreReviewResponse;
  onSelect: () => void;
}) {
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{review.teamName}</td>
      <td style={bodyCell}>{review.roundType ?? "—"}</td>
      <td style={bodyCell}>{review.deviationValue.toFixed(1)}</td>
      <td style={bodyCell}><StatusBadge status={review.status} /></td>
      <td style={bodyCell}>{new Date(review.createdAt).toLocaleString()}</td>
      <td style={bodyCell}>
        <button type="button" onClick={onSelect} className="text-sm font-semibold text-royal hover:underline">
          Details
        </button>
      </td>
    </tr>
  );
}

export function JudgeVariancePage() {
  const [eventId, setEventId] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScoreReviewStatus | "">("OPEN");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: eventsPage } = useAdminEvents();
  const events = eventsPage?.content ?? [];

  const { data: reviews = [], isLoading } = useScoreReviews(
    eventId,
    statusFilter ? { status: statusFilter } : undefined,
  );

  const openReviews = reviews.filter((r) => r.status === "OPEN");
  const avgDeviation = reviews.length
    ? reviews.reduce((s, r) => s + r.deviationValue, 0) / reviews.length
    : 0;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Score Deviation Review
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Auto-flagged when score deviation between judges is ≥ 25 (on a 0–100 scale).
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <select value={eventId} onChange={(e) => { setEventId(e.target.value); setSelectedId(null); }} style={inputStyle}>
          <option value="">Select event</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ScoreReviewStatus | "")}
          style={inputStyle}
          disabled={!eventId}
        >
          <option value="">All statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="IGNORED">IGNORED</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6" style={{ marginBottom: 32 }}>
        <div className="flex flex-col p-6 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5" }}>OPEN FLAGS</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#0e1528", marginTop: 4 }}>
            {isLoading ? "—" : openReviews.length}
          </span>
        </div>
        <div className="flex flex-col p-6 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5" }}>AVG DEVIATION</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#0e1528", marginTop: 4 }}>
            {isLoading || !reviews.length ? "—" : avgDeviation.toFixed(1)}
          </span>
        </div>
        <div className="flex flex-col p-6 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5" }}>TOTAL REVIEWS</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#0e1528", marginTop: 4 }}>
            {isLoading ? "—" : reviews.length}
          </span>
        </div>
      </div>

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(198,198,205,0.3)" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>Deviation Flags</span>
        </div>
        {!eventId ? (
          <p style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
            Select an event to view the list.
          </p>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#eef0f6" }}>
                <th style={headerCell}>Team</th>
                <th style={headerCell}>Round</th>
                <th style={{ ...headerCell, width: 100 }}>Deviation</th>
                <th style={{ ...headerCell, width: 100 }}>Status</th>
                <th style={headerCell}>Created</th>
                <th style={{ ...headerCell, width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} style={{ padding: "14px 16px" }}>
                          <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : reviews.map((r) => (
                    <ReviewRow key={r.id} review={r} onSelect={() => setSelectedId(r.id)} />
                  ))}
              {!isLoading && eventId && reviews.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                    No reviews found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedId && eventId && (
        <ReviewDetailModal
          eventId={eventId}
          reviewId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
