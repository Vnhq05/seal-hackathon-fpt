"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuditLogs } from "@/features/admin/hooks/use-audit-logs";
import { formatActorLabel, useAuditActorMap } from "@/features/admin/hooks/use-audit-actor-map";
import { AuditValuePair } from "@/features/admin/components/audit-value-display";
import type { AuditLogResponse } from "@/lib/api";

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
  verticalAlign: "top",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  outline: "none",
  width: "100%",
};

function truncateId(id: string | null): string {
  if (!id) return "—";
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function applyClientFilters(
  entries: AuditLogResponse[],
  actorId: string,
  action: string,
  targetType: string,
): AuditLogResponse[] {
  return entries.filter((entry) => {
    if (actorId && entry.actorId !== actorId) return false;
    if (action && entry.action !== action) return false;
    if (targetType && entry.targetType !== targetType) return false;
    return true;
  });
}

export function AuditLogsPage() {
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);

  const hasDateRange = Boolean(fromDate && toDate);
  const hasSecondaryFilters = Boolean(actorId || action || targetType);
  const showClientFilterNote = hasDateRange && hasSecondaryFilters;

  const { data, isLoading, isError, error } = useAuditLogs({
    actorId: hasDateRange ? undefined : actorId || undefined,
    action: hasDateRange ? undefined : action || undefined,
    targetType: hasDateRange ? undefined : targetType || undefined,
    fromDate: hasDateRange ? fromDate : undefined,
    toDate: hasDateRange ? toDate : undefined,
    page,
    size: 50,
  });

  const entries = useMemo(() => {
    const raw = data?.content ?? [];
    return showClientFilterNote
      ? applyClientFilters(raw, actorId, action, targetType)
      : raw;
  }, [data?.content, showClientFilterNote, actorId, action, targetType]);

  const actorMap = useAuditActorMap(entries.map((entry) => entry.actorId));
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const clearFilters = () => {
    setActorId("");
    setAction("");
    setTargetType("");
    setFromDate("");
    setToDate("");
    setPage(0);
  };

  const updateFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            Audit Logs
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Full system activity history with filters and change details.
          </p>
        </div>
        <Link
          href="/admin/export"
          className="flex items-center gap-2 border-2 border-navy bg-white px-4 py-2 text-[13px] font-semibold text-navy"
        >
          Export CSV/JSON
        </Link>
      </div>

      <div
        className="flex flex-wrap items-end gap-3"
        style={{ marginBottom: 16 }}
      >
        <div className="flex flex-col" style={{ minWidth: 180, flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Actor ID (UUID)</label>
          <input
            type="text"
            placeholder="UUID"
            value={actorId}
            onChange={(e) => updateFilter(setActorId)(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div className="flex flex-col" style={{ minWidth: 140, flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Action</label>
          <input
            type="text"
            placeholder="e.g. CREATE_EVENT"
            value={action}
            onChange={(e) => updateFilter(setAction)(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div className="flex flex-col" style={{ minWidth: 140, flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Target type</label>
          <input
            type="text"
            placeholder="e.g. Event"
            value={targetType}
            onChange={(e) => updateFilter(setTargetType)(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div className="flex flex-col" style={{ minWidth: 140 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => updateFilter(setFromDate)(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div className="flex flex-col" style={{ minWidth: 140 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => updateFilter(setToDate)(e.target.value)}
            style={inputStyle}
          />
        </div>
        <button
          type="button"
          onClick={clearFilters}
          style={{ ...inputStyle, width: "auto", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Clear filters
        </button>
      </div>

      <p style={{ fontSize: 12, color: "#8891a5", marginBottom: 16 }}>
        Date range uses server filter; other filters use server when no dates are set.
      </p>

      {showClientFilterNote && (
        <p style={{ fontSize: 12, color: "#92400e", backgroundColor: "#fef3c7", padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>
          Date range is server-filtered; other filters apply to entries on this page.
        </p>
      )}

      <div className="overflow-x-auto border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 960 }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={{ ...headerCell, width: 160 }}>Timestamp</th>
              <th style={{ ...headerCell, width: 200 }}>Actor</th>
              <th style={{ ...headerCell, width: 140 }}>Action</th>
              <th style={{ ...headerCell, width: 160 }}>Target</th>
              <th style={headerCell}>Changes</th>
              <th style={{ ...headerCell, width: 120 }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ padding: "14px 16px" }}>
                        <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "70%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              : entries.map((entry) => (
                  <tr key={entry.id} style={{ borderTop: "1px solid rgba(223,226,236,0.5)" }}>
                    <td style={bodyCell}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td style={bodyCell}>
                      <span title={entry.actorId}>
                        {formatActorLabel(entry.actorId, actorMap)}
                      </span>
                    </td>
                    <td style={{ ...bodyCell, fontWeight: 600 }}>{entry.action}</td>
                    <td style={bodyCell}>
                      {entry.targetType && (
                        <span
                          className="mr-2 rounded"
                          style={{ fontSize: 11, fontWeight: 500, backgroundColor: "#eef0f6", color: "#2dd4bf", padding: "1px 6px" }}
                        >
                          {entry.targetType}
                        </span>
                      )}
                      <span
                        style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}
                        title={entry.targetId ?? undefined}
                      >
                        {truncateId(entry.targetId)}
                      </span>
                    </td>
                    <td style={{ ...bodyCell, minWidth: 280 }}>
                      <AuditValuePair oldValue={entry.oldValue} newValue={entry.newValue} />
                    </td>
                    <td style={{ ...bodyCell, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                      {entry.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))}
            {!isLoading && isError && (
              <tr>
                <td colSpan={6} style={{ ...bodyCell, textAlign: "center", color: "#991b1b", padding: "48px 16px" }}>
                  {error?.message || "Failed to load audit logs. Please check your login session."}
                </td>
              </tr>
            )}
            {!isLoading && !isError && entries.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && !isError && totalElements > 0 && (
        <div className="flex items-center justify-center gap-2" style={{ marginTop: 16 }}>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            style={{ ...inputStyle, width: "auto", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span style={{ fontSize: 14, color: "#8891a5" }}>
            Page {page + 1} of {totalPages} · {totalElements.toLocaleString()} entries
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            style={{ ...inputStyle, width: "auto", cursor: page >= totalPages - 1 ? "default" : "pointer", opacity: page >= totalPages - 1 ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
