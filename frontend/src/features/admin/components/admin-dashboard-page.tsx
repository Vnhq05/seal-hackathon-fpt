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
          <h1 className="font-mono text-3xl font-bold tracking-tight text-navy">
            Overview
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Platform metrics and system activity
          </p>
        </div>
        <Link
          href="/admin/export"
          className="flex items-center gap-2 border-2 border-navy bg-white px-4 py-2 text-[13px] font-semibold text-navy"
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
