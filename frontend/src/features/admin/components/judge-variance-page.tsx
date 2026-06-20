"use client";

import { useJudgeVariance } from "@/features/admin/hooks/use-admin-system";
import type { JudgeVarianceEntry } from "@/features/admin/types/admin-analytics.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 24 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px" }}>{label}</span>
      <span style={{ fontSize: 24, fontWeight: 700, color: "#0e1528", marginTop: 4 }}>{value}</span>
    </div>
  );
}

export function JudgeVariancePage() {
  const { data, isLoading } = useJudgeVariance();
  // data.entries is never[] from stub; cast safely
  const entries = (data?.entries ?? []) as JudgeVarianceEntry[];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Judge Variance Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Analyze judge scoring patterns and detect outliers.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6" style={{ marginBottom: 32 }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg" style={{ height: 100, backgroundColor: "rgba(223,226,236,0.8)", border: "1px solid rgba(198,198,205,0.3)" }} />
          ))
        ) : (
          <>
            <StatCard label="INTER-RATER RELIABILITY" value={data?.interRaterReliability?.toFixed(2) ?? "--"} />
            <StatCard label="AVERAGE VARIANCE" value={data?.averageVariance?.toFixed(2) ?? "--"} />
            <StatCard label="JUDGES ANALYZED" value={entries.length} />
          </>
        )}
      </div>

      {/* Chart placeholder */}
      <div
        className="flex flex-col items-center justify-center rounded-lg"
        style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 48, marginBottom: 32, minHeight: 200 }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect x="4" y="24" width="8" height="20" rx="2" fill="rgba(223,226,236,0.8)" />
          <rect x="16" y="12" width="8" height="32" rx="2" fill="rgba(223,226,236,0.8)" />
          <rect x="28" y="18" width="8" height="26" rx="2" fill="rgba(223,226,236,0.8)" />
          <rect x="40" y="6" width="4" height="38" rx="2" fill="rgba(223,226,236,0.8)" />
        </svg>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginTop: 12 }}>Variance Chart</p>
        <p style={{ fontSize: 13, color: "#8891a5", marginTop: 4 }}>Chart will render when data is available.</p>
      </div>

      {/* Outlier detection table */}
      <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(198,198,205,0.3)" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>Outlier Detection</span>
        </div>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Judge</th>
              <th style={{ ...headerCell, width: 100 }}>Avg Score</th>
              <th style={{ ...headerCell, width: 100 }}>Std Dev</th>
              <th style={{ ...headerCell, width: 120 }}>Scored</th>
              <th style={{ ...headerCell, width: 90 }}>Outlier</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}><div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "50%" }} /></td>
                  ))}</tr>
                ))
              : entries.map((e) => (
                  <tr key={e.judgeId} style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
                    <td style={{ ...bodyCell, fontWeight: 600 }}>{e.judgeName}</td>
                    <td style={bodyCell}>{e.avgScore.toFixed(2)}</td>
                    <td style={bodyCell}>{e.stdDeviation.toFixed(2)}</td>
                    <td style={bodyCell}>{e.submissionsScored}</td>
                    <td style={bodyCell}>
                      {e.isOutlier ? (
                        <span className="inline-flex rounded-full px-2 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#fef2f2", color: "#991b1b" }}>Yes</span>
                      ) : (
                        <span className="inline-flex rounded-full px-2 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#f0fdf4", color: "#166534" }}>No</span>
                      )}
                    </td>
                  </tr>
                ))
            }
            {!isLoading && entries.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No variance data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
