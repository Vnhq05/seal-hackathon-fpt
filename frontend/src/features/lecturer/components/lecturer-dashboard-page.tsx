"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { mentorInvitationApi } from "@/lib/api/mentor-invitation.api";
import { useJudgeScoringAssignments } from "@/features/judging/hooks/use-judge-scoring-assignments";
import { useJudgeDashboard } from "@/features/judging/hooks/use-judge-dashboard";
import { ScoringSuggestionsPanel } from "@/features/judging/components/scoring-suggestions-panel";
import { TeamsNeedingSupportPanel } from "@/features/progress/components/teams-needing-support-panel";

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="border-2 border-navy bg-white p-5 shadow-[4px_4px_0_0_#0c1228] transition-colors hover:border-navy"
    >
      <p className="text-sm text-seal-text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-seal-text">{value}</p>
    </Link>
  );
}

export function LecturerDashboardPage() {
  const { data: assignments = [], isLoading: judgingLoading } = useJudgeScoringAssignments();
  const { data: dashboard } = useJudgeDashboard();
  const { data: mentorRooms = [], isLoading: mentorLoading } = useQuery({
    queryKey: ["lecturer-mentor-rooms"],
    queryFn: () => mentorInvitationApi.getAllMentorActiveRooms(),
  });

  if (judgingLoading && mentorLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-seal-purple border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-seal-text">Lecturer Dashboard</h1>
        <p className="mt-1 text-sm text-seal-text-muted">
          Overview of your judging assignments and mentoring teams.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-seal-text">Judging</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Teams assigned" value={assignments.length} href="/lecturer/scoring" />
          <StatCard
            label="Pending scoring"
            value={dashboard?.stats.remaining ?? 0}
            href="/lecturer/scoring"
          />
          <StatCard
            label="Completed"
            value={dashboard?.stats.scored ?? 0}
            href="/lecturer/history"
          />
        </div>
        {dashboard && dashboard.scoringSuggestions.length > 0 && (
          <ScoringSuggestionsPanel
            suggestions={dashboard.scoringSuggestions}
            portalBase="/lecturer"
          />
        )}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/lecturer/scoring"
            className="border-2 border-navy bg-seal-yellow px-4 py-2 text-sm text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228]"
          >
            Go to Scoring
          </Link>
          <Link
            href="/lecturer/rounds"
            className="border-2 border-navy bg-white px-4 py-2 text-sm font-mono font-bold text-navy shadow-[4px_4px_0_0_#0c1228] hover:bg-seal-surface-sunken"
          >
            Assigned Rounds
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-seal-text">Mentoring</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Active mentor teams" value={mentorRooms.length} href="/lecturer/teams" />
        </div>
        <TeamsNeedingSupportPanel scope="mentor" />
        <div className="flex flex-wrap gap-3">
          <Link
            href="/lecturer/teams"
            className="border-2 border-navy bg-seal-yellow px-4 py-2 text-sm text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228]"
          >
            My Teams
          </Link>
          <Link
            href="/lecturer/mentor-hub"
            className="border-2 border-navy bg-white px-4 py-2 text-sm font-mono font-bold text-navy shadow-[4px_4px_0_0_#0c1228] hover:bg-seal-surface-sunken"
          >
            Mentor Hub
          </Link>
        </div>
      </section>
    </div>
  );
}
