"use client";

import Link from "next/link";
import { useAdminActivity } from "@/features/admin/hooks/use-admin-dashboard";
import type { AuditLogResponse } from "@/lib/api";

const DOT_COLORS: Record<string, string> = {
  blue: "#38bdf8",
  green: "#22c55e",
  orange: "#f59e0b",
  gray: "#2dd4bf",
};

function actionColor(action: string): string {
  if (action.startsWith("CREATE")) return "green";
  if (action.startsWith("UPDATE")) return "blue";
  if (action.startsWith("DELETE")) return "orange";
  return "gray";
}

export function AdminActivityFeed() {
  const { data: activitiesPage, isLoading } = useAdminActivity();
  const activities = activitiesPage?.content ?? [];

  return (
    <div
      className="rounded-lg"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 24 }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e1528" }}>System Activity</h3>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="animate-pulse rounded-full" style={{ width: 8, height: 8, backgroundColor: "rgba(223,226,236,0.8)", marginTop: 5 }} />
              <div className="flex-1">
                <div className="animate-pulse rounded" style={{ width: "80%", height: 12, backgroundColor: "rgba(223,226,236,0.8)" }} />
                <div className="animate-pulse rounded" style={{ width: "50%", height: 10, backgroundColor: "rgba(223,226,236,0.8)", marginTop: 4 }} />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <p style={{ fontSize: 14, color: "#8891a5", textAlign: "center", padding: "16px 0" }}>
            No recent activity.
          </p>
        ) : (
          activities.map((entry: AuditLogResponse) => (
            <div key={entry.id} className="flex gap-3">
              <div
                className="mt-1 flex-shrink-0 rounded-full"
                style={{ width: 8, height: 8, backgroundColor: DOT_COLORS[actionColor(entry.action)] ?? DOT_COLORS.gray }}
              />
              <div className="min-w-0">
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0e1528", lineHeight: "18px" }}>
                  {entry.action}
                  {entry.targetType && (
                    <span
                      className="ml-2 rounded"
                      style={{ fontSize: 11, fontWeight: 500, backgroundColor: "#ffffff", color: "#2dd4bf", padding: "1px 6px" }}
                    >
                      {entry.targetType}
                    </span>
                  )}
                </p>
                <p style={{ fontSize: 12, color: "#8891a5", lineHeight: "16px" }}>
                  {new Date(entry.timestamp).toLocaleString()}
                  {entry.targetId ? ` • ${entry.targetId}` : ""}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ borderTop: "1px solid rgba(223,226,236,0.8)", marginTop: 16, paddingTop: 12 }}>
        <Link href="/admin/export" style={{ fontSize: 13, fontWeight: 600, color: "#38bdf8" }}>
          View audit export
        </Link>
      </div>
    </div>
  );
}
