"use client";

import Link from "next/link";
import { useStaffDashboard } from "@/features/coordinator/hooks/use-staff-dashboard";
import { StaffPendingApprovals } from "@/features/coordinator/components/staff-pending-approvals";
import { StaffQuickActions } from "@/features/coordinator/components/staff-quick-actions";

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-5 transition-shadow hover:shadow-[6px_6px_0_0_#0c1228]">
      <p className="text-sm font-medium text-seal-text-muted">{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold text-navy">{value}</p>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse border-2 border-navy/10 bg-seal-surface-sunken ${className ?? "h-24"}`} />;
}

export function CoordinatorDashboardPage() {
  const { data: summary, isLoading } = useStaffDashboard();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-navy">
          Coordinator Dashboard
        </h1>
        <p className="mt-1 text-sm text-seal-text-muted">
          Manage enrollments, participants, and event operations.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} />
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Pending Approvals"
              value={summary.pendingApprovals}
              href="/coordinator/user-approval"
            />
            <StatCard label="Active Hackathons" value={summary.activeHackathons} />
            <StatCard
              label="Participants"
              value={summary.totalParticipants}
              href="/coordinator/participants"
            />
          </div>

          {summary.pendingApprovals > 0 && (
            <div className="mb-6 border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-[2px_2px_0_0_#0c1228]">
              <span className="font-semibold">{summary.pendingApprovals} user(s)</span> awaiting approval.{" "}
              <Link href="/coordinator/user-approval" className="font-medium text-royal underline-offset-2 hover:underline">
                Review now
              </Link>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <StaffPendingApprovals />
            <StaffQuickActions />
          </div>
        </>
      ) : null}
    </div>
  );
}
