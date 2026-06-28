"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminRounds, useDeleteRound } from "@/features/admin/hooks/use-admin-rounds";
import { useAdminEvents } from "@/features/admin/hooks/use-admin-hackathons";
import type { RoundResponse } from "@/lib/api";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

function RoundRow({ r, eventId }: { r: RoundResponse; eventId: string }) {
  const { mutate: remove, isPending } = useDeleteRound(eventId);
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={bodyCell}>{r.roundNumber}</td>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{r.name}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>
        {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
      </td>
      <td style={bodyCell}>{r.criteria.length}</td>
      <td style={bodyCell}>{r.judgeCount}</td>
      <td style={bodyCell}>
        <div className="flex gap-2">
          <Link href={`/admin/hackathons/${eventId}`} style={{ fontSize: 12, fontWeight: 600, color: "#38bdf8" }}>
            View Event
          </Link>
          <button
            onClick={() => remove(r.id)}
            disabled={isPending}
            style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export function RoundManagementPage() {
  const [eventId, setEventId] = useState<string>("");
  const { data: eventsPage } = useAdminEvents();
  const { data: rounds, isLoading } = useAdminRounds(eventId);

  const events = eventsPage?.content ?? [];
  const roundsList = rounds ?? [];

  const selectStyle: React.CSSProperties = {
    border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "8px 12px", fontSize: 14,
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            Round Management
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Manage rounds for each event.
          </p>
        </div>
        <Link
          href="/admin/rounds/new"
          className="flex items-center justify-center border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer"
        >
          Add Round
        </Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select Event</option>
          {events.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={{ ...headerCell, width: 60 }}>#</th>
              <th style={headerCell}>Name</th>
              <th style={headerCell}>Duration</th>
              <th style={{ ...headerCell, width: 100 }}>Criteria</th>
              <th style={{ ...headerCell, width: 80 }}>Judges</th>
              <th style={{ ...headerCell, width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ padding: "14px 16px" }}>
                        <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              : roundsList.map((r) => <RoundRow key={r.id} r={r} eventId={eventId} />)
            }
            {!isLoading && roundsList.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  {eventId ? "No rounds found for this event." : "Select an event to view rounds."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
