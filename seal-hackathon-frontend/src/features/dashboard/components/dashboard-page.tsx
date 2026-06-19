"use client";

import Link from "next/link";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useDashboardSummary } from "@/features/dashboard/hooks/use-dashboard-summary";
import { useDashboardTeam } from "@/features/dashboard/hooks/use-dashboard-team";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import type { DashboardSummary, DashboardTeam } from "@/features/dashboard/types/dashboard.types";
import type { Notification } from "@/features/notifications/types/notification.types";

function ArrowRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 1v4M13 1v4M1 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TeamSmallIcon() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 15c0-3.314 3.134-6 7-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21 15c0-2.761-2.239-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="15" height="17" viewBox="0 0 15 17" fill="none" aria-hidden="true">
      <path d="M2 1v15M2 1h10l-3 4.5L12 10H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M5 1h8v5a4 4 0 01-8 0V1z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 3H2a1 1 0 00-1 1v1a3 3 0 003 3M13 3h3a1 1 0 011 1v1a3 3 0 01-3 3M9 10v3M6 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BellSmallIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
      <path d="M8 1a5 5 0 015 5v4l2 2H1l2-2V6a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 14a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SkeletonBlock({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-seal-surface-elevated"
      style={{ height }}
    />
  );
}

function WelcomeBanner({ userName }: { userName: string }) {
  return (
    <div className="flex items-center justify-between overflow-hidden rounded-lg bg-seal-cyan p-8">
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white">
          Welcome back, {userName} 👋
        </h1>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-white/70">
          Check your dashboard for the latest updates on your hackathon progress.
        </p>
      </div>

      <Link
        href="/participant/submissions"
        className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-white/15 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/25"
      >
        View my submission
        <ArrowRightIcon />
      </Link>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-seal-border bg-seal-surface p-6 shadow-sm transition-all duration-200 hover:shadow-md" style={{ minHeight: 160 }}>
      <div className="flex items-start justify-between pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-seal-surface-elevated text-seal-text-muted">
          {icon}
        </div>
        {badge}
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-seal-text-secondary">{label}</p>
        <div className="mt-1">{value}</div>
      </div>
    </div>
  );
}

function StatsRow({ summary, team }: { summary: DashboardSummary | undefined; team: DashboardTeam | null | undefined }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        icon={<CalendarIcon />}
        label="Active Events"
        badge={
          summary && summary.activeHackathons > 0 ? (
            <span className="rounded-lg bg-seal-cyan/10 px-2.5 py-1 text-xs font-medium text-seal-cyan-dark">Active</span>
          ) : undefined
        }
        value={
          <p className="text-[32px] font-bold leading-tight tracking-tight text-seal-text">
            {summary?.activeHackathons ?? 0}
          </p>
        }
      />
      <StatCard
        icon={<TeamSmallIcon />}
        label="My Team"
        value={<p className="text-2xl font-semibold tracking-tight text-seal-text">{team?.name ?? "—"}</p>}
      />
      <StatCard
        icon={<FlagIcon />}
        label="Submissions"
        value={
          <p className="text-[32px] font-bold leading-tight tracking-tight text-seal-text">{summary?.submissionCount ?? 0}</p>
        }
      />
      <StatCard
        icon={<TrophyIcon />}
        label="Notifications"
        badge={
          summary && summary.unreadNotifications > 0 ? (
            <span className="flex items-center gap-1 rounded-lg bg-seal-amber/10 px-2.5 py-1 text-xs font-medium text-amber-700">
              {summary.unreadNotifications}
            </span>
          ) : undefined
        }
        value={<p className="text-[32px] font-bold leading-tight tracking-tight text-seal-text">{summary?.unreadNotifications ?? 0}</p>}
      />
    </div>
  );
}

function UpdateItem({
  notification,
  showBorder,
}: {
  notification: Notification;
  showBorder?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-4 py-4 ${showBorder ? "border-t border-seal-border-light" : ""}`}
    >
      <div className="flex flex-col items-start pt-2" style={{ width: 8, flexShrink: 0 }}>
        <span
          className={`block h-2 w-2 rounded-full ${notification.isRead ? "bg-seal-border" : "bg-seal-cyan"}`}
        />
      </div>
      <div>
        <p className="text-sm text-seal-text">
          <span className="font-bold">{notification.title}:</span>
          <span> {notification.message}</span>
        </p>
        <p className="mt-1 text-xs font-medium text-seal-text-muted">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </div>
  );
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function RecentUpdates({ notifications }: { notifications: Notification[] }) {
  return (
    <div className="rounded-lg border border-seal-border bg-seal-surface p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-seal-text">
          <BellSmallIcon />
          <h2 className="text-xl font-semibold tracking-tight">
            Recent Updates
          </h2>
        </div>
        <Link href="/participant/notifications" className="text-xs font-semibold text-seal-cyan transition-colors hover:text-seal-cyan-dark">
          See all
        </Link>
      </div>
      {notifications.length === 0 ? (
        <p className="py-4 text-sm text-seal-text-muted">
          No recent updates.
        </p>
      ) : (
        <div>
          {notifications.slice(0, 3).map((n, i) => (
            <UpdateItem key={n.id} notification={n} showBorder={i > 0} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamQuickCard({ team }: { team: DashboardTeam | null | undefined }) {
  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-seal-border bg-seal-surface p-6 text-center shadow-sm">
        <div className="text-seal-text-muted">
          <TeamSmallIcon />
        </div>
        <p className="mt-4 text-base font-semibold text-seal-text">No team yet</p>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Join or create a team to get started.
        </p>
        <Link
          href="/participant/teams"
          className="mt-4 inline-flex items-center justify-center rounded-lg border border-seal-border bg-seal-surface-elevated px-6 py-2.5 text-xs font-semibold text-seal-text transition-all duration-200 hover:border-seal-cyan/30 hover:bg-seal-cyan/5"
        >
          Browse Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-seal-border bg-seal-surface shadow-sm">
      <div className="border-b border-seal-border-light p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-seal-text">
            {team.name}
          </h2>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-seal-text-secondary">
            {team.memberCount}/{team.maxMembers} members
          </span>
          {team.trackName && (
            <>
              <span className="block h-1 w-1 rounded-full bg-seal-border-dark" />
              <span className="text-sm text-seal-text-secondary">{team.trackName}</span>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              team.hackathonStatus === "active"
                ? "bg-seal-success/10 text-emerald-700"
                : "bg-seal-surface-elevated text-seal-text-secondary"
            }`}
          >
            {team.hackathonStatus === "active" ? "Active" : team.hackathonStatus}
          </span>
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              team.submissionStatus === "submitted"
                ? "bg-seal-success/10 text-emerald-700"
                : "bg-seal-surface-elevated text-seal-text-secondary"
            }`}
          >
            {team.submissionStatus === "submitted" ? "Submitted" : team.submissionStatus === "reviewed" ? "Reviewed" : "Not submitted"}
          </span>
        </div>
      </div>

      <div className="border-t border-seal-border-light bg-seal-surface-sunken p-4">
        <Link
          href="/participant/teams"
          className="flex w-full items-center justify-center rounded-lg border border-seal-border bg-seal-surface px-4 py-2.5 text-xs font-semibold text-seal-text transition-all duration-200 hover:border-seal-cyan/30 hover:bg-seal-cyan/5"
        >
          View Team Details
        </Link>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: team, isLoading: teamLoading } = useDashboardTeam();
  const { data: notifData, isLoading: notifLoading } = useNotifications("all");

  const notifications = notifData?.data ?? [];
  const firstName = user?.name?.split(" ")[0] ?? "there";

  if (summaryLoading && teamLoading) {
    return (
      <div className="flex flex-col gap-6">
        <SkeletonBlock height={140} />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={160} />)}
        </div>
        <div className="grid gap-6" style={{ gridTemplateColumns: "2fr 1fr" }}>
          <div className="flex flex-col gap-6">
            <SkeletonBlock height={200} />
            <SkeletonBlock height={250} />
          </div>
          <SkeletonBlock height={400} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner userName={firstName} />
      <StatsRow summary={summary} team={team} />

      <div className="grid gap-6 pt-2" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="flex flex-col gap-6">
          <RecentUpdates notifications={notifications} />
        </div>
        <TeamQuickCard team={team} />
      </div>
    </div>
  );
}
