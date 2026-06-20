"use client";

import { DashboardStatCard } from "@/features/dashboard/components/dashboard-stat-card";
import { useDashboardSummary } from "@/features/dashboard/hooks/use-dashboard-summary";

function HackathonStatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M11 2l2.09 4.26 4.71.68-3.4 3.32.8 4.67L11 12.5l-4.2 2.43.8-4.67L4.2 6.94l4.71-.68L11 2z"
        stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TeamStatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="9" cy="7" r="3" stroke="#1d4ed8" strokeWidth="1.5" />
      <path d="M3 19c0-3.314 2.686-6 6-6" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="8" r="2.5" stroke="#1d4ed8" strokeWidth="1.5" />
      <path d="M19 19c0-2.761-1.343-5-3-5" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NotificationStatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M11 3a6 6 0 016 6v4l1.5 2.5h-15L5 13V9a6 6 0 016-6z"
        stroke="#c2410c" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.5 18a2.5 2.5 0 005 0" stroke="#c2410c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-lg animate-pulse" style={{ border: "1px solid rgba(223,226,236,0.8)", padding: "20px 24px", height: 120, backgroundColor: "#f5f5f5" }} />
  );
}

export function DashboardStats() {
  const { data: summary, isLoading } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3" style={{ gap: "16px" }}>
        {Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3" style={{ gap: "16px" }}>
      <DashboardStatCard
        label="Active Hackathons"
        value={summary?.activeHackathons ?? 0}
        icon={<HackathonStatIcon />}
        iconBg="#ede9fe"
      />
      <DashboardStatCard
        label="Total Events"
        value={summary?.totalHackathons ?? 0}
        icon={<TeamStatIcon />}
        iconBg="#dbeafe"
      />
      <DashboardStatCard
        label="Notifications"
        value={summary?.unreadNotifications ?? 0}
        icon={<NotificationStatIcon />}
        iconBg="#ffedd5"
      />
    </div>
  );
}
