"use client";

import { useStaffDashboard } from "@/features/coordinator/hooks/use-staff-dashboard";
import { StaffActionBanner } from "@/features/coordinator/components/staff-action-banner";
import { StaffStatsRow } from "@/features/coordinator/components/staff-stats-row";
import { StaffEventTimeline } from "@/features/coordinator/components/staff-event-timeline";
import { StaffQuickActions } from "@/features/coordinator/components/staff-quick-actions";
import { StaffPendingApprovals } from "@/features/coordinator/components/staff-pending-approvals";

function SkeletonBlock({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse border-2 border-navy/10 bg-seal-surface-sunken"
      style={{ height }}
    />
  );
}

export function StaffDashboardPage() {
  const { data: summary, isLoading } = useStaffDashboard();

  return (
    <div className="mx-auto max-w-[1440px] p-8">
      <div className="mb-6">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-navy">
          Staff Dashboard
        </h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Command center for event operations.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <SkeletonBlock height={60} />
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} height={100} />)}
          </div>
          <SkeletonBlock height={100} />
          <div className="flex gap-4">
            <SkeletonBlock height={240} />
            <div className="w-80 shrink-0">
              <SkeletonBlock height={240} />
            </div>
          </div>
        </div>
      ) : summary ? (
        <>
          <StaffActionBanner
            pendingApprovals={summary.pendingApprovals}
            flaggedTeams={summary.flaggedTeams}
          />
          <StaffStatsRow summary={summary} />
          <StaffEventTimeline phase={summary.timelinePhase || "submissions"} />
          <div className="flex gap-6">
            <StaffPendingApprovals />
            <div className="w-80 shrink-0">
              <StaffQuickActions />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
