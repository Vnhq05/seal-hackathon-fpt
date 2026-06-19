"use client";

import Link from "next/link";
import { useActiveEvents } from "@/features/admin/hooks/use-admin-dashboard";

const statusColors: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#f0fdf4", color: "#166534" },
  Upcoming: { bg: "#eff6ff", color: "#1d4ed8" },
  Ended: { bg: "#eef0f6", color: "#2dd4bf" },
};

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

function StatusBadge({ status }: { status: string }) {
  const c = statusColors[status] ?? statusColors.Ended;
  return (
    <span
      className="inline-flex rounded-full px-2 py-1"
      style={{ fontSize: 12, fontWeight: 600, backgroundColor: c.bg, color: c.color }}
    >
      {status}
    </span>
  );
}

function AvatarStack({ avatars }: { avatars: string[] }) {
  const initials = avatars.slice(0, 3);
  const extra = avatars.length - 3;
  return (
    <div className="flex -space-x-2">
      {initials.map((a, i) => (
        <div
          key={i}
          className="flex items-center justify-center rounded-full border-2 border-white"
          style={{ width: 28, height: 28, backgroundColor: ["#38bdf8", "#f59e0b", "#ec4899"][i % 3], zIndex: 3 - i }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: "#ffffff" }}>{a}</span>
        </div>
      ))}
      {extra > 0 && (
        <div
          className="flex items-center justify-center rounded-full border-2 border-white"
          style={{ width: 28, height: 28, backgroundColor: "rgba(223,226,236,0.8)", zIndex: 0 }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: "#8891a5" }}>+{extra}</span>
        </div>
      )}
    </div>
  );
}

export function AdminEventsTable() {
  const { data: events, isLoading } = useActiveEvents();

  return (
    <div
      className="rounded-lg"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", flex: 1 }}
    >
      <div className="flex items-center justify-between" style={{ padding: "20px 24px" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>Active & Upcoming Events</h3>
        <Link href="/admin/hackathons" style={{ fontSize: 13, fontWeight: 600, color: "#38bdf8" }}>
          View all
        </Link>
      </div>

      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
            <th style={headerCell}>Event Name</th>
            <th style={{ ...headerCell, width: 100 }}>Status</th>
            <th style={{ ...headerCell, width: 120 }}>Participants</th>
            <th style={headerCell}>Round</th>
            <th style={{ ...headerCell, width: 120 }}>Staff</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} style={{ padding: "14px 16px" }}>
                    <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
                  </td>
                ))}
              </tr>
            ))
          ) : !events || events.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "32px 16px" }}>
                No active events.
              </td>
            </tr>
          ) : (
            events.map((event) => (
              <tr key={event.id} style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
                <td style={{ ...bodyCell, fontWeight: 600 }}>{event.name}</td>
                <td style={bodyCell}><StatusBadge status={event.status} /></td>
                <td style={bodyCell}>{event.participants.toLocaleString()}</td>
                <td style={{ ...bodyCell, color: "#8891a5" }}>{event.round}</td>
                <td style={bodyCell}><AvatarStack avatars={event.staffAvatars} /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
