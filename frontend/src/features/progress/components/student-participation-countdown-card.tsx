"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { eventApi, roundApi, teamApi } from "@/lib/api";
import { findCurrentRound } from "@/features/lecturer-mentor/lib/mentor-team-mappers";
import { useRealtimeCountdown } from "@/features/progress/hooks/use-realtime-countdown";
import { formatRealtimeDeadline } from "@/features/progress/lib/progress.utils";

function ArrowRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StudentParticipationCountdownCard({ eventId }: { eventId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["student-participation-countdown", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const [event, rounds, team] = await Promise.all([
        eventApi.getById(eventId!),
        roundApi.list(eventId!),
        teamApi.getMyTeam(eventId!).catch(() => null),
      ]);
      const currentRound = findCurrentRound(rounds);
      return { event, team, currentRound };
    },
  });

  const msLeft = useRealtimeCountdown(data?.currentRound?.submissionDeadline);

  if (!eventId || isLoading) {
    return (
      <div className="border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]">
        <div className="h-20 animate-pulse rounded bg-seal-surface-sunken" />
      </div>
    );
  }

  if (!data?.event || !data.team) {
    return null;
  }

  const countdownLabel = formatRealtimeDeadline(msLeft);
  const isUrgent = msLeft !== null && msLeft > 0 && msLeft <= 6 * 60 * 60 * 1000;

  return (
    <div
      className={`border-2 p-6 shadow-[4px_4px_0_0_#0c1228] ${
        isUrgent ? "border-amber-300 bg-amber-50" : "border-navy bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-seal-text-muted">
            Active competition
          </p>
          <h2 className="mt-1 font-mono text-xl font-bold text-navy">{data.event.name}</h2>
          <p className="mt-2 text-sm text-seal-text-secondary">
            Team: <span className="font-semibold text-navy">{data.team.name}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-seal-text-muted">
            Submission deadline
          </p>
          <p
            className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
              isUrgent ? "text-rose-700" : "text-navy"
            }`}
          >
            {countdownLabel}
          </p>
          {data.currentRound?.name && (
            <p className="mt-1 text-xs text-seal-text-muted">{data.currentRound.name}</p>
          )}
        </div>
      </div>
      <Link
        href="/student/submissions"
        className="mt-4 inline-flex items-center gap-2 font-mono text-xs font-bold text-navy underline"
      >
        Go to submissions
        <ArrowRightIcon />
      </Link>
    </div>
  );
}
