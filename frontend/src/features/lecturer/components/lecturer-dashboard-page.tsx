"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { mentorInvitationApi } from "@/lib/api/mentor-invitation.api";
import { useJudgeScoringAssignments } from "@/features/judging/hooks/use-judge-scoring-assignments";

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-seal-border/50 bg-white p-5 shadow-sm transition-colors hover:border-seal-purple/40"
    >
      <p className="text-sm text-seal-text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-seal-text">{value}</p>
    </Link>
  );
}

export function LecturerDashboardPage() {
  const { data: assignments = [], isLoading: judgingLoading } = useJudgeScoringAssignments();
  const { data: mentorRooms = [], isLoading: mentorLoading } = useQuery({
    queryKey: ["lecturer-mentor-rooms"],
    queryFn: () => mentorInvitationApi.getAllMentorActiveRooms(),
  });

  const pendingScoring = assignments.filter(
    (a) => a.scoringStatus === "NOT_STARTED" || a.scoringStatus === "IN_PROGRESS",
  ).length;
  const completedScoring = assignments.filter((a) => a.scoringStatus === "COMPLETED").length;

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
          <StatCard label="Pending scoring" value={pendingScoring} href="/lecturer/scoring" />
          <StatCard label="Completed" value={completedScoring} href="/lecturer/history" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/lecturer/scoring"
            className="rounded-lg bg-seal-purple px-4 py-2 text-sm font-semibold text-white hover:bg-seal-purple-dark"
          >
            Go to Scoring
          </Link>
          <Link
            href="/lecturer/rounds"
            className="rounded-lg border border-seal-border px-4 py-2 text-sm font-semibold text-seal-text hover:bg-seal-bg"
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
        <div className="flex flex-wrap gap-3">
          <Link
            href="/lecturer/teams"
            className="rounded-lg bg-seal-purple px-4 py-2 text-sm font-semibold text-white hover:bg-seal-purple-dark"
          >
            My Teams
          </Link>
          <Link
            href="/lecturer/mentor-hub"
            className="rounded-lg border border-seal-border px-4 py-2 text-sm font-semibold text-seal-text hover:bg-seal-bg"
          >
            Mentor Hub
          </Link>
        </div>
      </section>
    </div>
  );
}
