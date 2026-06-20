"use client";

import Link from "next/link";
import { useAdminDashboard } from "@/features/admin/hooks/use-admin-dashboard";
import { AdminSystemBanner } from "@/features/admin/components/admin-system-banner";
import { AdminStatsGrid } from "@/features/admin/components/admin-stats-grid";
import { AdminRegistrationChart } from "@/features/admin/components/admin-registration-chart";
import { AdminQuickActions } from "@/features/admin/components/admin-quick-actions";
import { AdminActivityFeed } from "@/features/admin/components/admin-activity-feed";
import { AdminEventsTable } from "@/features/admin/components/admin-events-table";

function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="#0e1528" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();

  return (
    <div style={{ padding: 24 }}>
      <AdminSystemBanner operational={true} />

      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            Overview
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Platform metrics and system activity
          </p>
        </div>
        <Link
          href="/admin/export"
          className="flex items-center gap-2 rounded-lg"
          style={{ padding: "8px 16px", border: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#ffffff", fontSize: 13, fontWeight: 600, color: "#0e1528" }}
        >
          <ExportIcon />
          Export
        </Link>
      </div>

      <AdminStatsGrid data={data} loading={isLoading} />

      <div className="flex gap-6" style={{ marginBottom: 24 }}>
        <AdminRegistrationChart />
        <div style={{ width: 320, flexShrink: 0 }}>
          <AdminQuickActions />
          <AdminActivityFeed />
        </div>
      </div>

      <AdminEventsTable />
    </div>
  );
}
