"use client";

import { useJudgeDashboard } from "@/features/judging/hooks/use-judge-dashboard";
import { JudgeUrgencyBanner } from "@/features/judging/components/judge-urgency-banner";
import { JudgeStatsRow } from "@/features/judging/components/judge-stats-row";
import { JudgeAssignedRoundsSection } from "@/features/judging/components/judge-assigned-rounds-section";
import { JudgeQuickStart } from "@/features/judging/components/judge-quick-start";
import { JudgeRecentActivity } from "@/features/judging/components/judge-recent-activity";

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" style={{ padding: 32, maxWidth: 1440 }}>
      <div className="animate-pulse rounded-lg" style={{ height: 56, backgroundColor: "rgba(223,226,236,0.8)" }} />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg" style={{ height: 104, backgroundColor: "rgba(223,226,236,0.8)" }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <div className="animate-pulse rounded-lg" style={{ height: 130, backgroundColor: "rgba(223,226,236,0.8)" }} />
          <div className="animate-pulse rounded-lg" style={{ height: 130, backgroundColor: "rgba(223,226,236,0.8)" }} />
        </div>
        <div className="animate-pulse rounded-lg" style={{ height: 300, backgroundColor: "rgba(223,226,236,0.8)" }} />
      </div>
    </div>
  );
}

export function JudgeDashboardPage() {
  const { data: dashboard, isLoading } = useJudgeDashboard();

  if (isLoading || !dashboard) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-6" style={{ padding: "16px 32px 32px", maxWidth: 1440 }}>
      {dashboard.urgency && <JudgeUrgencyBanner urgency={dashboard.urgency} />}

      <JudgeStatsRow stats={dashboard.stats} />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <JudgeAssignedRoundsSection rounds={dashboard.assignedRounds} />
        </div>
        <div className="flex flex-col gap-6">
          <JudgeQuickStart dashboard={dashboard} />
          <JudgeRecentActivity activities={dashboard.recentActivity} />
        </div>
      </div>
    </div>
  );
}
