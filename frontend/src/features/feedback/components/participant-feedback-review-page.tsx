"use client";

import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import {
  useParticipantFeedbackList,
  useParticipantFeedbackSummary,
} from "@/features/feedback/hooks/use-participant-feedback";
import { useDownloadFeedback } from "@/features/feedback/hooks/use-download-feedback";
import type { ParticipantFeedbackResponse } from "@/lib/api/participant-feedback.api";

const PAGE_SIZE = 10;

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

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 14,
  border: "1px solid rgba(198,198,205,0.5)",
  borderRadius: 8,
  minWidth: 280,
};

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-navy bg-white p-4 shadow-[3px_3px_0_0_#0c1228]">
      <p className="text-xs font-semibold uppercase tracking-wide text-seal-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

function DistributionBar({
  distribution,
}: {
  distribution: Record<string, number>;
}) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return <p className="text-sm text-seal-text-muted">No feedback yet.</p>;
  }

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[String(star)] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-3 text-sm">
            <span className="w-12 font-mono text-seal-text-muted">{star} ★</span>
            <div className="h-2 flex-1 overflow-hidden rounded bg-seal-surface-elevated">
              <div className="h-full bg-royal" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-10 text-right text-seal-text-muted">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function formatStars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function truncateComment(comment: string | null, maxLen = 120): string {
  if (!comment) return "—";
  if (comment.length <= maxLen) return comment;
  return `${comment.slice(0, maxLen)}…`;
}

export function ParticipantFeedbackReviewPage() {
  const { data: events = [] } = useQuery({
    queryKey: ["coordinator-events"],
    queryFn: () => eventApi.list({ page: 0, size: 50 }).then((p) => p.content),
  });

  const [eventId, setEventId] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selectedEventId = eventId || events[0]?.id || "";

  const { data: summary, isLoading: summaryLoading } = useParticipantFeedbackSummary(selectedEventId);
  const { data: feedbackList = [], isLoading: listLoading } = useParticipantFeedbackList(selectedEventId);
  const downloadMutation = useDownloadFeedback();

  const loading = summaryLoading || listLoading;

  const totalPages = Math.max(1, Math.ceil(feedbackList.length / PAGE_SIZE));

  const paginatedList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return feedbackList.slice(start, start + PAGE_SIZE);
  }, [feedbackList, page]);

  const handleEventChange = (newEventId: string) => {
    setEventId(newEventId);
    setPage(1);
    setExpandedId(null);
  };

  const handleRowClick = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Participant Feedback</h1>
          <p className="text-sm text-seal-text-secondary">
            View post-event feedback from CONFIRMED team members.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadMutation.mutate(selectedEventId)}
          disabled={
            !selectedEventId || feedbackList.length === 0 || downloadMutation.isPending
          }
          className="shrink-0 border-2 border-navy bg-white px-5 py-2.5 text-[13px] font-semibold text-navy shadow-[3px_3px_0_0_#0c1228] transition-colors hover:bg-seal-surface-elevated disabled:opacity-50"
        >
          {downloadMutation.isPending ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-navy">Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => handleEventChange(e.target.value)}
          style={selectStyle}
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} ({ev.status})
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-seal-text-muted">Loading...</p>}

      {!loading && summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Responses" value={String(summary.totalCount)} />
          <SummaryCard
            label="Average rating"
            value={`${summary.averageRating?.toFixed(1) ?? "—"}/5`}
          />
          <div className="border-2 border-navy bg-white p-4 shadow-[3px_3px_0_0_#0c1228] sm:col-span-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-seal-text-muted">
              Distribution
            </p>
            <DistributionBar distribution={summary.ratingDistribution} />
          </div>
        </div>
      )}

      {!loading && (
        <div className="overflow-x-auto border-2 border-navy bg-white shadow-[3px_3px_0_0_#0c1228]">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="border-b border-seal-border">
                <th style={headerCell}>Submitted at</th>
                <th style={headerCell}>Participant</th>
                <th style={headerCell}>Team</th>
                <th style={headerCell}>Rating</th>
                <th style={headerCell}>Comment</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...bodyCell, textAlign: "center", color: "#8891a5" }}>
                    No feedback submitted yet.
                  </td>
                </tr>
              )}
              {paginatedList.map((fb: ParticipantFeedbackResponse) => (
                <Fragment key={fb.id}>
                  <tr
                    onClick={() => handleRowClick(fb.id)}
                    className="cursor-pointer border-b border-seal-border last:border-0 hover:bg-seal-surface-elevated/50"
                  >
                    <td style={bodyCell}>
                      {new Date(fb.submittedAt).toLocaleString()}
                    </td>
                    <td style={bodyCell}>{fb.userFullName ?? fb.userId}</td>
                    <td style={bodyCell}>{fb.teamName ?? "—"}</td>
                    <td style={bodyCell}>
                      <span className="font-mono text-royal">{formatStars(fb.overallRating)}</span>
                      <span className="ml-2 text-seal-text-secondary">{fb.overallRating}/5</span>
                    </td>
                    <td style={{ ...bodyCell, maxWidth: 320 }}>
                      {truncateComment(fb.comment)}
                    </td>
                  </tr>
                  {expandedId === fb.id && (
                    <tr className="border-b border-seal-border bg-seal-surface-elevated/30">
                      <td colSpan={5} style={{ ...bodyCell, paddingTop: 8, paddingBottom: 16 }}>
                        <p className="mb-1 text-xs font-semibold uppercase text-seal-text-muted">
                          Full comment
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-navy">{fb.comment ?? "—"}</p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {feedbackList.length > 0 && (
            <div className="flex items-center justify-between border-t border-seal-border px-4 py-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="border-2 border-navy bg-white px-4 py-1.5 text-sm font-semibold text-navy shadow-[2px_2px_0_0_#0c1228] disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-seal-text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="border-2 border-navy bg-white px-4 py-1.5 text-sm font-semibold text-navy shadow-[2px_2px_0_0_#0c1228] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
