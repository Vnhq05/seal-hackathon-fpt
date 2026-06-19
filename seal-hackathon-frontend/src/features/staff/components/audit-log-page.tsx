"use client";

import { useState } from "react";
import { useStaffAuditLog } from "@/features/staff/hooks/use-staff-audit-log";
import type { AuditLogEntry } from "@/features/staff/types/staff.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.24px",
  lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

function RowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
        </td>
      ))}
    </tr>
  );
}

function LogRow({ entry }: { entry: AuditLogEntry }) {
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={bodyCell}>
        <span className="rounded-md px-2 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#ffffff", color: "#2dd4bf" }}>
          {entry.action}
        </span>
      </td>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{entry.performedBy}</td>
      <td style={bodyCell}>{entry.targetType}</td>
      <td style={{ ...bodyCell, color: "#8891a5", fontFamily: "monospace", fontSize: 12 }}>{entry.targetId}</td>
      <td style={{ ...bodyCell, color: "#8891a5", maxWidth: 240 }}>
        <span className="block truncate">{entry.details}</span>
      </td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>
        {new Date(entry.createdAt).toLocaleString()}
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg py-16 text-center" style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}>
      <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No audit log entries</p>
      <p className="mt-1" style={{ fontSize: 14, color: "#8891a5" }}>Activity will be recorded here as staff actions are performed.</p>
    </div>
  );
}

export function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStaffAuditLog({ page, pageSize: 20, search: search || undefined });

  const entries = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Audit Log
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Track all staff actions and changes across the platform.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by action, user, or target..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg"
          style={{ width: 320, padding: "8px 12px", fontSize: 14, border: "1px solid rgba(223,226,236,0.8)", outline: "none", color: "#0e1528", backgroundColor: "#ffffff" }}
        />
      </div>

      {!isLoading && entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#eef0f6" }}>
                <th style={{ ...headerCell, width: 140 }}>Action</th>
                <th style={headerCell}>Performed By</th>
                <th style={headerCell}>Target Type</th>
                <th style={headerCell}>Target ID</th>
                <th style={headerCell}>Details</th>
                <th style={{ ...headerCell, width: 180 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
                : entries.map((e) => <LogRow key={e.id} entry={e} />)
              }
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, color: "#8891a5" }}>Page {page} of {totalPages} ({total} total)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-md px-3 py-1" style={{ fontSize: 12, border: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#ffffff", cursor: page <= 1 ? "default" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}>Previous</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-md px-3 py-1" style={{ fontSize: 12, border: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#ffffff", cursor: page >= totalPages ? "default" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
