"use client";

import { useState } from "react";
import { useAdminEvents } from "@/features/admin/hooks/use-admin-hackathons";
import {
  useParticipantFeedbackList,
  useParticipantFeedbackSummary,
} from "@/features/feedback/hooks/use-participant-feedback";
import type { ParticipantFeedbackResponse } from "@/lib/api/participant-feedback.api";

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

export function ParticipantFeedbackReviewPage() {
  const { data: eventsPage } = useAdminEvents();
  const events = eventsPage?.content ?? [];
  const [eventId, setEventId] = useState("");

  const selectedEventId = eventId || events[0]?.id || "";

  const { data: summary, isLoading: summaryLoading } = useParticipantFeedbackSummary(selectedEventId);
  const { data: feedbackList = [], isLoading: listLoading } = useParticipantFeedbackList(selectedEventId);

  const loading = summaryLoading || listLoading;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Participant Feedback</h1>
        <p className="text-sm text-seal-text-secondary">
          View post-event feedback from CONFIRMED team members.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-navy">Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => setEventId(e.target.value)}
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
          <SummaryCard label="Total feedback" value={String(summary.totalCount)} />
          <SummaryCard
            label="Avg. rating"
            value={summary.averageRating != null ? summary.averageRating.toFixed(1) : "—"}
          />
          <div className="border-2 border-navy bg-white p-4 shadow-[3px_3px_0_0_#0c1228] sm:col-span-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-seal-text-muted">
              Rating distribution
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
                <th style={headerCell}>Submitter</th>
                <th style={headerCell}>Team</th>
                <th style={headerCell}>Rating</th>
                <th style={headerCell}>Comment</th>
                <th style={headerCell}>Submitted at</th>
              </tr>
            </thead>
            <tbody>
              {feedbackList.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...bodyCell, textAlign: "center", color: "#8891a5" }}>
                    No feedback yet.
                  </td>
                </tr>
              )}
              {feedbackList.map((fb: ParticipantFeedbackResponse) => (
                <tr key={fb.id} className="border-b border-seal-border last:border-0">
                  <td style={bodyCell}>{fb.userFullName ?? fb.userId}</td>
                  <td style={bodyCell}>{fb.teamName ?? "—"}</td>
                  <td style={bodyCell}>
                    <span className="font-mono font-semibold text-royal">{fb.overallRating}/5</span>
                  </td>
                  <td style={{ ...bodyCell, maxWidth: 320 }}>
                    <span className="line-clamp-3">{fb.comment ?? "—"}</span>
                  </td>
                  <td style={bodyCell}>
                    {new Date(fb.submittedAt).toLocaleString("en-US")}
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
