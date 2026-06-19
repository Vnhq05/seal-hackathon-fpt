"use client";

import Link from "next/link";
import { useAdminTracks, useDeleteTrack } from "@/features/admin/hooks/use-admin-tracks";
import type { AdminTrack, TrackStatus } from "@/features/admin/types/admin.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

const STATUS_STYLES: Record<TrackStatus, React.CSSProperties> = {
  OPEN: { backgroundColor: "#f0fdf4", color: "#166534" },
  CLOSED: { backgroundColor: "#ffffff", color: "#2dd4bf" },
};

function TrackRow({ t }: { t: AdminTrack }) {
  const { mutate: remove, isPending } = useDeleteTrack();
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{t.name}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{t.hackathonName}</td>
      <td style={bodyCell}>{t.teamsCount}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{t.mentorName ?? "Unassigned"}</td>
      <td style={bodyCell}>
        <span className="inline-flex rounded-full px-2 py-1" style={{ fontSize: 12, fontWeight: 600, ...STATUS_STYLES[t.status] }}>
          {t.status}
        </span>
      </td>
      <td style={bodyCell}>
        <div className="flex gap-2">
          <Link href={`/admin/tracks/${t.id}`} style={{ fontSize: 12, fontWeight: 600, color: "#38bdf8" }}>Edit</Link>
          <button
            onClick={() => remove(t.id)}
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

export function TrackManagementPage() {
  const { data, isLoading } = useAdminTracks();
  const tracks = data?.data ?? [];

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            Track Management
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Manage tracks across hackathons.
          </p>
        </div>
        <Link
          href="/admin/tracks/new"
          className="flex items-center justify-center rounded-lg"
          style={{ backgroundColor: "#38bdf8", padding: "10px 20px", color: "#ffffff", fontSize: 14, fontWeight: 600 }}
        >
          Add Track
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Track Name</th>
              <th style={headerCell}>Hackathon</th>
              <th style={{ ...headerCell, width: 80 }}>Teams</th>
              <th style={headerCell}>Mentor</th>
              <th style={{ ...headerCell, width: 90 }}>Status</th>
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
              : tracks.map((t) => <TrackRow key={t.id} t={t} />)
            }
            {!isLoading && tracks.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No tracks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
