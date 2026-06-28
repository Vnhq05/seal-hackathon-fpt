"use client";

import { useState } from "react";
import { useAdminEvents } from "@/features/admin/hooks/use-admin-hackathons";
import { useDownloadExport } from "@/features/admin/hooks/use-admin-system";
import type { AuditExportRequest } from "@/lib/api";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 };

export function ExportReportPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState<"CSV" | "JSON">("CSV");

  const { data: eventsPage } = useAdminEvents();
  const { mutate: download, isPending: downloading } = useDownloadExport();

  const canExport = startDate && endDate;

  const handleDownload = () => {
    if (!canExport) return;
    const params: AuditExportRequest = { startDate, endDate, format };
    download(params, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-export.${format.toLowerCase()}`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Export Report
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Export audit logs for a date range.
        </p>
      </div>

      <div className="flex flex-col gap-6 p-8 mb-6 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label style={labelStyle}>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as "CSV" | "JSON")} style={inputStyle}>
              <option value="CSV">CSV</option>
              <option value="JSON">JSON</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading || !canExport}
          className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer"
        >
          {downloading ? "Downloading..." : "Download"}
        </button>
      </div>

      {/* Events summary for reference */}
      {eventsPage && eventsPage.content.length > 0 && (
        <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6">
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 8 }}>
            Available Events ({eventsPage.totalElements} total)
          </p>
          <div className="flex flex-wrap gap-2">
            {eventsPage.content.slice(0, 10).map((e) => (
              <span key={e.id} className="rounded-full px-2 py-1" style={{ fontSize: 12, backgroundColor: "#eef0f6", color: "#0e1528" }}>
                {e.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
