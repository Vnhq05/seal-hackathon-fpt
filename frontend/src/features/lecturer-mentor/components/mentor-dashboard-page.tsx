"use client";

import { useMentorSummary } from "@/features/lecturer-mentor/hooks/use-mentor-summary";
import { usePortalBase } from "@/shared/hooks/use-portal-base";
import { MentorDashboardStats } from "@/features/lecturer-mentor/components/mentor-dashboard-stats";
import { MentorDashboardTrackCard } from "@/features/lecturer-mentor/components/mentor-dashboard-track-card";
import { MentorDashboardActivity } from "@/features/lecturer-mentor/components/mentor-dashboard-activity";

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" style={{ padding: 32, maxWidth: 1440 }}>
      <div className="animate-pulse border-2 border-navy/10 bg-seal-surface-sunken" style={{ height: 140 }} />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="animate-pulse border-2 border-navy/10 bg-seal-surface-sunken" style={{ height: 300 }} />
        </div>
        <div className="animate-pulse border-2 border-navy/10 bg-seal-surface-sunken" style={{ height: 400 }} />
      </div>
    </div>
  );
}

export function MentorDashboardPage() {
  const portalBase = usePortalBase();
  const { data: summary, isLoading } = useMentorSummary();

  if (isLoading) return <PageSkeleton />;

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center py-32" style={{ padding: 32 }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No track assigned</p>
        <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
          You have not been assigned to any hackathon track yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" style={{ padding: 32, maxWidth: 1440 }}>
      <MentorDashboardStats summary={summary} />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <MentorDashboardTrackCard summary={summary} portalBase={portalBase} />
        </div>
        <div>
          <MentorDashboardActivity />
        </div>
      </div>
    </div>
  );
}
