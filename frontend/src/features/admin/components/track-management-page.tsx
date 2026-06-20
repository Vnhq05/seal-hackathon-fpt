"use client";

import Link from "next/link";
import { useAdminTracks, useDeleteTrack } from "@/features/admin/hooks/use-admin-tracks";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

export function TrackManagementPage() {
  // useAdminTracks is an alias for useAdminCriteria which requires a roundId.
  // Since tracks no longer exist, this page shows a deprecation notice.
  // We pass an empty string so the hook stays disabled.
  const { data: _data, isLoading } = useAdminTracks("");
  const { mutate: _remove } = useDeleteTrack();

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            Track Management
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Tracks have been replaced by criteria per round. Use Event Criteria Configuration instead.
          </p>
        </div>
        <Link
          href="/admin/criteria/event"
          className="flex items-center justify-center rounded-lg"
          style={{ backgroundColor: "#38bdf8", padding: "10px 20px", color: "#ffffff", fontSize: 14, fontWeight: 600 }}
        >
          Go to Criteria
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Name</th>
              <th style={headerCell}>Description</th>
              <th style={{ ...headerCell, width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <td key={j} style={{ padding: "14px 16px" }}>
                        <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              : null
            }
            <tr>
              <td colSpan={3} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                Tracks are deprecated. Use criteria per round instead.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
