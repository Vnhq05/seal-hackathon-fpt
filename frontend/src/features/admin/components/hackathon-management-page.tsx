"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useAdminEvents,
  useCancelEvent,
  useDeleteEvent,
} from "@/features/admin/hooks/use-admin-hackathons";
import type { EventResponse, EventStatus } from "@/lib/api";

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 500,
  border: "1px solid rgba(198,198,205,0.5)",
  borderRadius: 8,
  backgroundColor: "#ffffff",
  color: "#0e1528",
  cursor: "pointer",
  outline: "none",
};

const STATUS_STYLES: Record<EventStatus, React.CSSProperties> = {
  UPCOMING:  { backgroundColor: "#f0f9ff", color: "#0369a1" },
  OPEN:      { backgroundColor: "#e0f2fe", color: "#0284c7" },
  CLOSED_REGISTRATION: { backgroundColor: "#fef3c7", color: "#b45309" },
  ACTIVE:    { backgroundColor: "#dcfce7", color: "#166534" },
  SCORING:   { backgroundColor: "#ede9fe", color: "#6d28d9" },
  COMPLETED: { backgroundColor: "#eef0f6", color: "#8891a5" },
  CANCELLED: { backgroundColor: "#fef2f2", color: "#991b1b" },
};

const STATUS_LABELS: Record<EventStatus, string> = {
  UPCOMING:  "Upcoming",
  OPEN:      "Open",
  CLOSED_REGISTRATION: "Registration Closed",
  ACTIVE:    "Active",
  SCORING:   "Scoring",
  COMPLETED: "Closed",
  CANCELLED: "Cancelled",
};

function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className="inline-flex rounded-full px-3 py-1"
      style={{ fontSize: 12, fontWeight: 600, ...STATUS_STYLES[status] }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function ActionMenu({ event, onError }: { event: EventResponse; onError: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const errorHandler = { onError: (err: Error) => onError(err.message) };
  const { mutate: cancel, isPending: cancelling } = useCancelEvent();
  const { mutate: deleteEvent, isPending: deleting } = useDeleteEvent();

  const busy = cancelling || deleting;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  type Action = { label: string; onClick: () => void; color?: string; disabled?: boolean };
  const actions: Action[] = [];

  if (event.status !== "COMPLETED" && event.status !== "CANCELLED") {
    actions.push({
      label: "Edit",
      onClick: () => { setOpen(false); router.push(`/admin/hackathons/${event.id}`); },
    });
  }

  if (event.status !== "COMPLETED" && event.status !== "CANCELLED") {
    actions.push({
      label: "Enrollments",
      onClick: () => { setOpen(false); router.push(`/admin/hackathons/${event.id}/enrollments`); },
    });
  }

  if (event.status !== "COMPLETED" && event.status !== "CANCELLED") {
    actions.push({
      label: "Cancel",
      onClick: () => { setOpen(false); cancel(event.id, errorHandler); },
      color: "#b45309",
      disabled: busy,
    });
  }

  if (event.status !== "ACTIVE") {
    actions.push({
      label: confirmDelete ? "Confirm Delete" : "Delete",
      onClick: () => {
        if (confirmDelete) {
          setOpen(false);
          setConfirmDelete(false);
          deleteEvent(event.id, errorHandler);
        } else {
          setConfirmDelete(true);
        }
      },
      color: "#991b1b",
      disabled: busy,
    });
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => { setOpen(!open); setConfirmDelete(false); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 18, color: "#8891a5", padding: "4px 8px", lineHeight: 1,
        }}
        aria-label="Actions"
      >
        &#8942;
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "100%", zIndex: 50,
          minWidth: 160, backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)",
          borderRadius: 8, padding: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        }}>
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              disabled={a.disabled}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 12px", fontSize: 13, fontWeight: 500,
                color: a.color ?? "#0e1528",
                background: "none", border: "none", borderRadius: 4,
                cursor: a.disabled ? "not-allowed" : "pointer",
                opacity: a.disabled ? 0.5 : 1,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fc")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
        </td>
      ))}
    </tr>
  );
}

function HackathonRow({ h, onError }: { h: EventResponse; onError: (msg: string) => void }) {
  const trackNames = h.tracks.map((t) => t.name).join(" / ");

  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>
        {h.name}
        {trackNames && (
          <p style={{ fontSize: 12, color: "#8891a5", fontWeight: 400, marginTop: 2 }}>{trackNames}</p>
        )}
      </td>
      <td style={bodyCell}><StatusBadge status={h.status} /></td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{h.season}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{h.year}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{h.format ?? "OFFLINE"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{h.startDate}</td>
      <td style={bodyCell}>{h.roundCount}</td>
      <td style={{ ...bodyCell, textAlign: "center" }}>
        <ActionMenu event={h} onError={onError} />
      </td>
    </tr>
  );
}

export function HackathonManagementPage() {
  const currentYear = new Date().getFullYear();
  const [season, setSeason] = useState<string>("");
  const [year, setYear] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const params = {
    ...(season ? { season } : {}),
    ...(year ? { year } : {}),
    size: 50,
  };

  const { data: eventsPage, isLoading } = useAdminEvents(params);
  const hackathons = eventsPage?.content ?? [];

  const years: number[] = [];
  for (let y = currentYear + 2; y >= currentYear - 3; y--) {
    years.push(y);
  }

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            Event Management
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Create, edit, activate, or delete hackathon events. Coordinator can only manage their own events.
          </p>
        </div>
        <Link
          href="/admin/hackathons/new"
          className="flex items-center justify-center border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer"
        >
          Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Seasons</option>
          {SEASONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={year ?? ""}
          onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}
          style={selectStyle}
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {(season || year) && (
          <button
            onClick={() => { setSeason(""); setYear(undefined); }}
            style={{
              padding: "8px 12px", fontSize: 13, fontWeight: 500,
              color: "#8891a5", background: "none", border: "none",
              cursor: "pointer", textDecoration: "underline",
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div style={{
          backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991b1b",
        }}>
          {error}
        </div>
      )}

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Name</th>
              <th style={{ ...headerCell, width: 100 }}>Status</th>
              <th style={{ ...headerCell, width: 100 }}>Season</th>
              <th style={{ ...headerCell, width: 80 }}>Year</th>
              <th style={{ ...headerCell, width: 100 }}>Format</th>
              <th style={headerCell}>Start Date</th>
              <th style={{ ...headerCell, width: 80 }}>Rounds</th>
              <th style={{ ...headerCell, width: 60, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
              : hackathons.map((h) => <HackathonRow key={h.id} h={h} onError={setError} />)
            }
            {!isLoading && hackathons.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No events found. {season || year ? "Try adjusting your filters." : "Create one to get started."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
