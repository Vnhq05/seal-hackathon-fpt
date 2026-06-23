"use client";

import { useJudgeDashboard } from "@/features/judging/hooks/use-judge-dashboard";
import { useMentorSummary } from "@/features/mentor/hooks/use-mentor-summary";
import { JudgeUrgencyBanner } from "@/features/judging/components/judge-urgency-banner";
import { JudgeStatsRow } from "@/features/judging/components/judge-stats-row";
import { JudgeAssignedRoundsSection } from "@/features/judging/components/judge-assigned-rounds-section";
import { JudgeQuickStart } from "@/features/judging/components/judge-quick-start";
import { JudgeRecentActivity } from "@/features/judging/components/judge-recent-activity";
import { MentorDashboardStats } from "@/features/mentor/components/mentor-dashboard-stats";
import { MentorDashboardTrackCard } from "@/features/mentor/components/mentor-dashboard-track-card";
import { MentorDashboardActivity } from "@/features/mentor/components/mentor-dashboard-activity";
import Link from "next/link";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-seal-text tracking-tight">{children}</h2>
  );
}

function SectionDivider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-seal-border to-transparent" />;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg bg-seal-surface-elevated" style={{ height: 120 }} />
      ))}
    </div>
  );
}

function JudgingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="1" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 5h8M5 8.5h8M5 12h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function MentoringIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function LecturerDashboardPage() {
  const { data: judgeDashboard, isLoading: judgeLoading } = useJudgeDashboard();
  const { data: mentorSummary, isLoading: mentorLoading } = useMentorSummary();
  if (judgeLoading && mentorLoading) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-8">
      {/* ── Judging Section ── */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-seal-amber/10 text-seal-amber">
            <JudgingIcon />
          </div>
          <SectionHeading>Judging</SectionHeading>
          <Link
            href="/lecturer/rounds"
            className="ml-auto text-xs font-semibold text-violet-500 transition-colors hover:text-violet-600"
          >
            View all rounds
          </Link>
        </div>

        {judgeDashboard ? (
          <>
            {judgeDashboard.urgency && (
              <JudgeUrgencyBanner urgency={judgeDashboard.urgency} portalBase="/lecturer" />
            )}
            <JudgeStatsRow stats={judgeDashboard.stats} />
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <JudgeAssignedRoundsSection rounds={judgeDashboard.assignedRounds} portalBase="/lecturer" />
              </div>
              <div className="flex flex-col gap-6">
                <JudgeQuickStart dashboard={judgeDashboard} portalBase="/lecturer" />
                <JudgeRecentActivity activities={judgeDashboard.recentActivity} />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-seal-border bg-seal-surface p-6 text-sm text-seal-text-muted">
            No judging assignments yet.
          </div>
        )}
      </div>

      <SectionDivider />

      {/* ── Mentoring Section ── */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-seal-mint/10 text-seal-mint">
            <MentoringIcon />
          </div>
          <SectionHeading>Mentoring</SectionHeading>
          <Link
            href="/lecturer/teams"
            className="ml-auto text-xs font-semibold text-violet-500 transition-colors hover:text-violet-600"
          >
            View all teams
          </Link>
        </div>

        {mentorSummary ? (
          <>
            <MentorDashboardStats summary={mentorSummary} />
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <MentorDashboardTrackCard summary={mentorSummary} portalBase="/lecturer" />
              </div>
              <div>
                <MentorDashboardActivity />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-seal-border bg-seal-surface p-6 text-sm text-seal-text-muted">
            No mentoring assignments yet.
          </div>
        )}
      </div>
    </div>
  );
}
