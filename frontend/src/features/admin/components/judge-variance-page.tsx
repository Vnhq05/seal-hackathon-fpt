"use client";

import { useMemo, useState } from "react";
import { useAdminEvents } from "@/features/admin/hooks/use-admin-hackathons";
import {
  useApproveScoreReview,
  useResolveScoreReview,
  useScoreReviewDetail,
  useScoreReviews,
} from "@/features/admin/hooks/use-score-reviews";
import type { ScoreReviewResponse, ScoreReviewStatus } from "@/lib/api/score-review.api";
import { scoreReviewNoteLabel } from "@/lib/api/score-review.api";

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

type RoundTypeFilter = "PRELIMINARY" | "FINAL" | "";
type ListTab = "active" | "history";

const ACTIVE_STATUSES = new Set<ScoreReviewStatus>(["OPEN", "APPROVED"]);
const HISTORY_STATUSES = new Set<ScoreReviewStatus>([
  "REJECTED",
  "ADJUSTED",
  "RESOLVED",
  "IGNORED",
]);

const COL_COUNT = 8;

const LIST_TABS: { id: ListTab; label: string }[] = [
  { id: "active", label: "In progress" },
  { id: "history", label: "History" },
];

const tabBaseStyle: React.CSSProperties = {
  fontSize: 13,
  letterSpacing: "0.02em",
  lineHeight: "16px",
  background: "none",
  border: "none",
  padding: "12px 4px 10px",
  marginRight: 24,
  cursor: "pointer",
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

function rowBackground(deviation: number): string | undefined {
  if (deviation >= 50) return "rgba(254, 226, 226, 0.5)";
  if (deviation >= 25) return "rgba(254, 243, 199, 0.5)";
  return undefined;
}

function StatusBadge({ status }: { status: ScoreReviewStatus }) {
  const styles: Record<ScoreReviewStatus, string> = {
    OPEN: "bg-amber-50 text-amber-800",
    APPROVED: "bg-blue-50 text-blue-800",
    ADJUSTED: "bg-emerald-50 text-emerald-800",
    REJECTED: "bg-gray-100 text-gray-600",
    RESOLVED: "bg-emerald-50 text-emerald-800",
    IGNORED: "bg-gray-100 text-gray-600",
  };
  const labels: Record<ScoreReviewStatus, string> = {
    OPEN: "OPEN",
    APPROVED: "APPROVED",
    ADJUSTED: "ADJUSTED",
    REJECTED: "REJECTED",
    RESOLVED: "CLOSED",
    IGNORED: "IGNORED",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
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
  const { mutate: approve, isPending: isApproving } = useApproveScoreReview(eventId);
  const { mutate: resolve, isPending: isResolving } = useResolveScoreReview(eventId);
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const isPending = isApproving || isResolving;

  const actionErrorMessage = (err: unknown) =>
    err instanceof Error ? err.message : "Action failed. Please try again.";

  const handleApprove = () => {
    setActionError(null);
    approve(
      { reviewId, body: { resolutionNote: note.trim() || undefined } },
      {
        onSuccess: () => onClose(),
        onError: (err) => setActionError(actionErrorMessage(err)),
      },
    );
  };

  const handleReject = (status: "REJECTED" | "IGNORED") => {
    setActionError(null);
    resolve(
      { reviewId, body: { status, resolutionNote: note.trim() || undefined } },
      {
        onSuccess: () => onClose(),
        onError: (err) => setActionError(actionErrorMessage(err)),
      },
    );
  };

  const handleClose = () => {
    setActionError(null);
    resolve(
      { reviewId, body: { status: "RESOLVED", resolutionNote: note.trim() || undefined } },
      {
        onSuccess: () => onClose(),
        onError: (err) => setActionError(actionErrorMessage(err)),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-navy bg-white shadow-[8px_8px_0_0_#0c1228]">
        <div className="flex items-center justify-between border-b border-seal-border p-4">
          <h2 className="text-lg font-bold text-seal-text">Score Adjustment Request</h2>
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
                  <th style={{ ...headerCell, width: 120 }}>Weighted (0–5)</th>
                  <th style={{ ...headerCell, width: 100 }}>Score (%)</th>
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
              <tfoot>
                <tr style={{ borderTop: "2px solid rgba(198,198,205,0.5)", backgroundColor: "#f8f9fc" }}>
                  <td colSpan={4} style={{ ...bodyCell, fontWeight: 600 }}>
                    Min: {review.minJudgeScore.toFixed(1)}% · Max: {review.maxJudgeScore.toFixed(1)}%
                    {" · "}Deviation: {review.deviationValue.toFixed(1)} pts
                  </td>
                </tr>
              </tfoot>
            </table>

            {review.requestNote && (
              <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <span className="font-medium">Judge request:</span> {review.requestNote}
                {review.requestedByFullName && (
                  <span className="mt-1 block text-xs text-amber-800">
                    From {review.requestedByFullName}
                  </span>
                )}
              </div>
            )}

            {actionError && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {actionError}
              </div>
            )}

            {review.status === "OPEN" && (
              <div className="flex flex-col gap-3 border-t border-seal-border pt-4">
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Rejection / decision note (shown to judges)"
                  className="w-full rounded border border-seal-border px-3 py-2 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleReject("REJECTED")}
                    className="border-2 border-navy bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleApprove}
                    className="border-2 border-navy bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
                  >
                    {isApproving ? "Approving..." : "Approve adjustment"}
                  </button>
                </div>
              </div>
            )}

            {review.status === "APPROVED" && (
              <div className="flex flex-col gap-3 border-t border-seal-border pt-4">
                <p className="text-sm text-blue-800">
                  Judges can now revise their scores. Close this request after alignment is complete,
                  or it will auto-close when deviation drops below the threshold.
                </p>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Closing note (shown to judges, optional)"
                  className="w-full rounded border border-seal-border px-3 py-2 text-sm"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleClose}
                    className="border-2 border-navy bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
                  >
                    Mark complete
                  </button>
                </div>
              </div>
            )}

            {review.status !== "OPEN" && review.status !== "APPROVED" && (
              <div className={`rounded border border-seal-border p-4 text-sm ${
                review.status === "RESOLVED" || review.status === "ADJUSTED"
                  ? "bg-emerald-50"
                  : "bg-gray-50"
              }`}>
                {review.resolvedAt && (
                  <p>
                    <span className="font-medium text-seal-text">Resolved at:</span>{" "}
                    {new Date(review.resolvedAt).toLocaleString()}
                  </p>
                )}
                {review.resolutionNote && (
                  <p className={review.resolvedAt ? "mt-2" : ""}>
                    <span className="font-medium text-seal-text">
                      {scoreReviewNoteLabel(review.resolvedByRole)}:
                    </span>{" "}
                    {review.resolutionNote}
                    {review.resolvedByFullName?.trim() ? (
                      <span className="mt-1 block text-xs text-seal-text-muted">
                        By {review.resolvedByFullName.trim()}
                      </span>
                    ) : null}
                  </p>
                )}
              </div>
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
  const bg = rowBackground(review.deviationValue);
  const note = review.resolutionNote?.trim();
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)", backgroundColor: bg }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{review.teamName}</td>
      <td style={bodyCell}>{review.roundType ?? "—"}</td>
      <td style={bodyCell}>{review.deviationValue.toFixed(1)}</td>
      <td style={bodyCell}>
        {review.minJudgeScore.toFixed(0)} – {review.maxJudgeScore.toFixed(0)}
      </td>
      <td style={bodyCell}><StatusBadge status={review.status} /></td>
      <td style={{ ...bodyCell, color: note ? "#0e1528" : "#8891a5", maxWidth: 280 }}>
        {note ? (
          <span
            title={note}
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {note}
          </span>
        ) : (
          "—"
        )}
      </td>
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
  const [listTab, setListTab] = useState<ListTab>("active");
  const [roundTypeFilter, setRoundTypeFilter] = useState<RoundTypeFilter>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: eventsPage } = useAdminEvents();
  const events = eventsPage?.content ?? [];

  const { data: reviews = [], isLoading } = useScoreReviews(eventId);

  const openReviews = useMemo(
    () => reviews.filter((r) => ACTIVE_STATUSES.has(r.status)),
    [reviews],
  );
  const historyReviews = useMemo(
    () => reviews.filter((r) => HISTORY_STATUSES.has(r.status)),
    [reviews],
  );
  const pendingCount = openReviews.length;
  const historyCount = historyReviews.length;

  const displayedReviews = useMemo(() => {
    const statusSet = listTab === "active" ? ACTIVE_STATUSES : HISTORY_STATUSES;
    let list = reviews.filter((r) => statusSet.has(r.status));
    if (roundTypeFilter) {
      list = list.filter((r) => r.roundType === roundTypeFilter);
    }
    return [...list].sort((a, b) => b.deviationValue - a.deviationValue);
  }, [reviews, listTab, roundTypeFilter]);

  const avgDeviation = reviews.length
    ? reviews.reduce((s, r) => s + r.deviationValue, 0) / reviews.length
    : 0;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Score Adjustment Requests
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Flagged when judge score deviation is ≥ 25. Approve to let judges revise scores.
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
          value={roundTypeFilter}
          onChange={(e) => setRoundTypeFilter(e.target.value as RoundTypeFilter)}
          style={inputStyle}
          disabled={!eventId}
        >
          <option value="">All rounds</option>
          <option value="PRELIMINARY">PRELIMINARY</option>
          <option value="FINAL">FINAL</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6" style={{ marginBottom: 32 }}>
        <div className="flex flex-col p-6 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5" }}>ACTIVE REQUESTS</span>
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
        <div
          className="flex items-center justify-between gap-3"
          style={{ padding: "12px 16px", borderBottom: "1px solid rgba(198,198,205,0.3)" }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>Deviation Flags</span>
          {eventId && pendingCount > 0 && (
            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
              {pendingCount} pending review{pendingCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {eventId && (
          <div
            style={{
              padding: "0 16px",
              backgroundColor: "#f8f9fc",
              borderBottom: "1px solid rgba(223,226,236,0.9)",
            }}
          >
            <div className="flex items-stretch" role="tablist" aria-label="Score review list">
              {LIST_TABS.map((tab) => {
                const isActive = listTab === tab.id;
                const count = tab.id === "active" ? pendingCount : historyCount;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setListTab(tab.id)}
                    style={{
                      ...tabBaseStyle,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#0e1528" : "#8891a5",
                      borderBottom: isActive ? "2px solid #38bdf8" : "2px solid transparent",
                    }}
                  >
                    {tab.label}
                    <span
                      className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                      style={{
                        backgroundColor: isActive
                          ? tab.id === "active"
                            ? "rgba(251, 191, 36, 0.25)"
                            : "rgba(14, 21, 40, 0.08)"
                          : "rgba(14, 21, 40, 0.06)",
                        color: isActive && tab.id === "active" ? "#92400e" : "#4b5568",
                      }}
                    >
                      {isLoading ? "–" : count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                <th style={{ ...headerCell, width: 120 }}>Score Range</th>
                <th style={{ ...headerCell, width: 100 }}>Status</th>
                <th style={headerCell}>Resolution</th>
                <th style={headerCell}>Created</th>
                <th style={{ ...headerCell, width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: COL_COUNT }).map((__, j) => (
                        <td key={j} style={{ padding: "14px 16px" }}>
                          <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : displayedReviews.map((r) => (
                    <ReviewRow key={r.id} review={r} onSelect={() => setSelectedId(r.id)} />
                  ))}
              {!isLoading && eventId && displayedReviews.length === 0 && (
                <tr>
                  <td colSpan={COL_COUNT} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                    {listTab === "active"
                      ? "No reviews in progress."
                      : "No review history yet."}
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
