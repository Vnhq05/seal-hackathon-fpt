"use client";

import { useStaffDashboard } from "@/features/staff/hooks/use-staff-dashboard";
import { StaffActionBanner } from "@/features/staff/components/staff-action-banner";
import { StaffStatsRow } from "@/features/staff/components/staff-stats-row";
import { StaffEventTimeline } from "@/features/staff/components/staff-event-timeline";
import { StaffQuickActions } from "@/features/staff/components/staff-quick-actions";
import { StaffPendingApprovals } from "@/features/staff/components/staff-pending-approvals";

function SkeletonBlock({ height }: { height: number }) {
  return <div className="animate-pulse rounded-lg" style={{ height, backgroundColor: "rgba(223,226,236,0.8)" }} />;
}

export function StaffDashboardPage() {
  const { data: summary, isLoading } = useStaffDashboard();

  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Staff Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
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
            <div style={{ width: 320, flexShrink: 0 }}><SkeletonBlock height={240} /></div>
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
            <div style={{ width: 320, flexShrink: 0 }}>
              <StaffQuickActions />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
