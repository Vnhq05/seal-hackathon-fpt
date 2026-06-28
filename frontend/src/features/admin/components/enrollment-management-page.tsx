"use client";

import { useState } from "react";
import { useEnrollmentList, useApproveEnrollment, useRejectEnrollment } from "@/features/events/hooks/use-enrollment";
import type { EnrollmentStatus } from "@/lib/api";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.24px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", padding: "14px 16px",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#fef3c7", text: "#92400e" },
  APPROVED: { bg: "#d1fae5", text: "#065f46" },
  REJECTED: { bg: "#fee2e2", text: "#991b1b" },
  WITHDRAWN: { bg: "#f3f4f6", text: "#6b7280" },
};

export function EnrollmentManagementPage({ eventId }: { eventId: string }) {
  const [filter, setFilter] = useState<EnrollmentStatus | undefined>(undefined);
  const { data: enrollments = [], isLoading } = useEnrollmentList(eventId, filter);
  const { mutate: approve } = useApproveEnrollment(eventId);
  const { mutate: reject } = useRejectEnrollment(eventId);

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528" }}>Event Enrollments</h1>
          <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>Manage student enrollments for this event.</p>
        </div>
        <div className="flex gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s === "ALL" ? undefined : s as EnrollmentStatus)}
              style={{
                padding: "6px 14px", fontSize: 13, fontWeight: 600, borderRadius: 6, cursor: "pointer",
                backgroundColor: (s === "ALL" ? !filter : filter === s) ? "#38bdf8" : "#ffffff",
                color: (s === "ALL" ? !filter : filter === s) ? "#ffffff" : "#4a5468",
                border: "1px solid rgba(223,226,236,0.8)",
              }}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#eef0f6" }}>
                <th style={headerCell}>Name</th>
                <th style={headerCell}>Email</th>
                <th style={headerCell}>Student ID</th>
                <th style={headerCell}>University</th>
                <th style={{ ...headerCell, width: 120 }}>Status</th>
                <th style={{ ...headerCell, width: 160 }}>Enrolled At</th>
                <th style={{ ...headerCell, width: 160 }}>Actions</th>
              </tr>
            </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}>
                      <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "70%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              enrollments.map((e) => {
                const colors = statusColors[e.status] ?? statusColors.PENDING;
                return (
                  <tr key={e.id} style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
                    <td style={{ ...bodyCell, fontWeight: 600 }}>{e.userFullName}</td>
                    <td style={bodyCell}>{e.userEmail}</td>
                    <td style={bodyCell}>{e.userStudentId ?? "—"}</td>
                    <td style={bodyCell}>{e.userUniversityName ?? "—"}</td>
                    <td style={bodyCell}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 4, backgroundColor: colors.bg, color: colors.text }}>
                        {e.status}
                      </span>
                    </td>
                    <td style={{ ...bodyCell, color: "#8891a5" }}>
                      {new Date(e.enrolledAt).toLocaleDateString()}
                    </td>
                    <td style={bodyCell}>
                      {e.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button onClick={() => approve(e.id)} style={{ fontSize: 12, fontWeight: 600, color: "#065f46", background: "none", border: "none", cursor: "pointer" }}>Approve</button>
                          <button onClick={() => reject(e.id)} style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            {!isLoading && enrollments.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No enrollments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
