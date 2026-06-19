"use client";

import { useState } from "react";
import { useAdminHackathons } from "@/features/admin/hooks/use-admin-hackathons";
import { useExportPreview, useDownloadExport } from "@/features/admin/hooks/use-admin-system";
import type { ExportDataType, ExportFormat, ExportRequest } from "@/features/admin/types/admin-analytics.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};
const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 };

export function ExportReportPage() {
  const [hackathonId, setHackathonId] = useState("");
  const [dataType, setDataType] = useState<ExportDataType | "">("");
  const [format, setFormat] = useState<ExportFormat | "">("");

  const { data: hackathonsData } = useAdminHackathons();
  const params: ExportRequest | null =
    hackathonId && dataType && format
      ? { hackathonId, dataType: dataType as ExportDataType, format: format as ExportFormat }
      : null;
  const { data: preview, isLoading: loadingPreview } = useExportPreview(params);
  const { mutate: download, isPending: downloading } = useDownloadExport();

  const handleDownload = () => {
    if (!params) return;
    download(params, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-${dataType}.${format?.toLowerCase()}`;
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
          Select data to export and preview before downloading.
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 32, marginBottom: 24 }}>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label style={labelStyle}>Hackathon</label>
            <select value={hackathonId} onChange={(e) => setHackathonId(e.target.value)} style={inputStyle}>
              <option value="">Select</option>
              {hackathonsData?.data.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>Data Type</label>
            <select value={dataType} onChange={(e) => setDataType(e.target.value as ExportDataType)} style={inputStyle}>
              <option value="">Select</option>
              <option value="SUBMISSIONS">Submissions</option>
              <option value="SCORES">Scores</option>
              <option value="TEAMS">Teams</option>
              <option value="USERS">Users</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)} style={inputStyle}>
              <option value="">Select</option>
              <option value="CSV">CSV</option>
              <option value="JSON">JSON</option>
              <option value="PDF">PDF</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading || !params}
          className="rounded-lg"
          style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", width: "fit-content", opacity: downloading || !params ? 0.5 : 1 }}
        >
          {downloading ? "Downloading..." : "Download"}
        </button>
      </div>

      {/* Preview table */}
      {params && (
        <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(198,198,205,0.3)" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>
              Preview {preview ? `(${preview.totalRows} total rows)` : ""}
            </span>
          </div>
          {loadingPreview ? (
            <div style={{ padding: 32 }}>
              <div className="animate-pulse rounded" style={{ height: 14, width: "40%", backgroundColor: "rgba(223,226,236,0.8)" }} />
            </div>
          ) : preview && preview.columns.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#eef0f6" }}>
                    {preview.columns.map((col) => (
                      <th key={col} style={headerCell}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 10).map((row, idx) => (
                    <tr key={idx} style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
                      {preview.columns.map((col) => (
                        <td key={col} style={bodyCell}>{String(row[col] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#8891a5", fontSize: 14 }}>
              Select options above to preview data.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
