"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useDashboardSummary } from "@/features/dashboard/hooks/use-dashboard-summary";
import { useDashboardHackathons } from "@/features/dashboard/hooks/use-dashboard-hackathons";
import { useDashboardTeam } from "@/features/dashboard/hooks/use-dashboard-team";
import { useMyActiveEnrollment } from "@/features/events/hooks/use-enrollment";
import { EventScheduleTimeline } from "@/features/events/components/event-schedule-timeline";
import { useEventSchedule } from "@/features/events/hooks/use-event-schedule";
import {
  findActiveMilestone,
  findNextMilestone,
  getGateDeadlineFromRound,
} from "@/features/events/utils/schedule.utils";
import {
  formatCountdown,
  msUntil,
} from "@/features/submissions/utils/seal-submission.utils";
import { useQuery } from "@tanstack/react-query";
import { notificationApi, roundApi } from "@/lib/api";
import type { NotificationResponse, TeamResponse, EventResponse } from "@/lib/api";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useEventParticipationGate } from "@/features/events/hooks/use-event-participation-gate";

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
    <div className="flex items-center justify-between overflow-hidden border-2 border-navy bg-seal-yellow p-8 shadow-[4px_4px_0_0_#0c1228]">
      <div>
        <h1 className="font-mono text-[32px] font-bold leading-tight tracking-tight text-navy">
          Welcome back, {userName}
        </h1>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-navy/70">
          Check your dashboard for the latest updates on your hackathon progress.
        </p>
      </div>

      <Link
        href="/student/submissions"
        className="flex flex-shrink-0 items-center gap-2 border-2 border-navy bg-white px-6 py-2.5 font-mono text-sm font-bold text-navy shadow-[3px_3px_0_0_#0c1228] transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px]"
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
    <div className="flex min-h-[160px] flex-col justify-between border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]">
      <div className="flex items-start justify-between pb-4">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-navy/20 bg-seal-surface-sunken text-navy">
          {icon}
        </div>
        {badge}
      </div>
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-seal-text-muted">{label}</p>
        <div className="mt-1">{value}</div>
      </div>
    </div>
  );
}

interface DashboardSummaryData {
  activeHackathons: number;
  totalHackathons: number;
  unreadNotifications: number;
}

function StatsRow({ summary, team }: { summary: DashboardSummaryData | undefined; team: TeamResponse | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        icon={<CalendarIcon />}
        label="Active Events"
        badge={
          summary && summary.activeHackathons > 0 ? (
            <span className="border border-royal/30 bg-royal/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-royal">Active</span>
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function DashboardEventCard({
  event,
  activeEnrollment,
  profile,
}: {
  event: EventResponse;
  activeEnrollment: { eventId: string; status: string } | null | undefined;
  profile?: {
    studentStanding?: "ENROLLED" | "GRADUATED" | null;
    semester?: number | null;
    userType?: string;
  } | null;
}) {
  const isEnrolled = activeEnrollment?.eventId === event.id;
  const isPending = isEnrolled && activeEnrollment?.status === "PENDING";
  const isApproved = isEnrolled && activeEnrollment?.status === "APPROVED";

  const { canEnroll, enrollmentBlockReason, registrationClosedReason } =
    useEventParticipationGate(event, profile
      ? {
          studentStanding:
            profile.studentStanding ??
            (profile.userType === "FPT_STUDENT" || profile.userType === "EXTERNAL_STUDENT"
              ? "ENROLLED"
              : undefined),
          semester: profile.semester,
        }
      : undefined);
  const blockReason = enrollmentBlockReason ?? registrationClosedReason;

  return (
    <div className="flex w-full items-center justify-between gap-4 border-2 border-navy bg-white p-5 shadow-[4px_4px_0_0_#0c1228]">
      <div className="min-w-0 flex-1">
        <h3 className="font-mono text-base font-bold text-navy">{event.name}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-seal-text-secondary">
          <span>{event.season} {event.year}</span>
          <span>{event.trackCount} track{event.trackCount !== 1 ? "s" : ""}</span>
          <span>Register by: {formatDate(event.registrationDeadline)}</span>
        </div>
      </div>

      <div className="flex-shrink-0">
        {isApproved ? (
          <span className="inline-flex items-center rounded-lg bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            Participating
          </span>
        ) : isPending ? (
          <span className="inline-flex items-center rounded-lg bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
            Pending approval
          </span>
        ) : canEnroll ? (
          <Link
            href={`/hackathons/${event.id}/register`}
            className="inline-flex items-center border-2 border-navy bg-seal-yellow px-4 py-2 text-xs text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228]"
          >
            Register
          </Link>
        ) : (
          <span
            className="inline-flex max-w-[200px] items-center rounded-lg bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700"
            title={blockReason ?? undefined}
          >
            {blockReason ? "Unavailable" : "Register"}
          </span>
        )}
      </div>
    </div>
  );
}

function EventSection({
  title,
  description,
  events,
  activeEnrollment,
  profile,
}: {
  title: string;
  description: string;
  events: EventResponse[];
  activeEnrollment: { eventId: string; status: string } | null | undefined;
  profile?: {
    studentStanding?: "ENROLLED" | "GRADUATED" | null;
    semester?: number | null;
    userType?: string;
  } | null;
}) {
  if (events.length === 0) return null;

  return (
    <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-seal-text">{title}</h2>
        <p className="mt-1 text-sm text-seal-text-muted">{description}</p>
      </div>
      <div className="flex flex-col gap-3">
        {events.map((e) => (
          <DashboardEventCard key={e.id} event={e} activeEnrollment={activeEnrollment} profile={profile} />
        ))}
      </div>
    </div>
  );
}

function HackathonEvents({
  hackathons,
  activeEnrollment,
  profile,
}: {
  hackathons: EventResponse[];
  activeEnrollment: { eventId: string; status: string } | null | undefined;
  profile?: {
    studentStanding?: "ENROLLED" | "GRADUATED" | null;
    semester?: number | null;
    userType?: string;
  } | null;
}) {
  const openEvents = hackathons.filter((e) => e.status === "OPEN");
  const upcomingEvents = hackathons.filter((e) => e.status === "UPCOMING");

  if (openEvents.length === 0 && upcomingEvents.length === 0) {
    return (
      <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6">
        <p className="py-4 text-sm text-seal-text-muted">No events are open for registration or coming up right now.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <EventSection
        title="Open for registration"
        description="Events currently accepting registrations."
        events={openEvents}
        activeEnrollment={activeEnrollment}
        profile={profile}
      />
      <EventSection
        title="Coming soon"
        description="Events that will open registration soon."
        events={upcomingEvents}
        activeEnrollment={activeEnrollment}
        profile={profile}
      />
    </div>
  );
}

function UpdateItem({
  notification,
  showBorder,
}: {
  notification: NotificationResponse;
  showBorder?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-4 py-4 ${showBorder ? "border-t border-seal-border-light" : ""}`}
    >
      <div className="flex flex-col items-start pt-2" style={{ width: 8, flexShrink: 0 }}>
        <span
          className={`block h-2 w-2 rounded-full ${notification.read ? "bg-seal-border" : "bg-seal-cyan"}`}
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

function RecentUpdates({ notifications }: { notifications: NotificationResponse[] }) {
  return (
    <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-seal-text">
          <BellSmallIcon />
          <h2 className="text-xl font-semibold tracking-tight">
            Recent Updates
          </h2>
        </div>
        <Link href="/student/notifications" className="text-xs font-semibold text-royal transition-colors hover:text-royal/80">
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

function ScheduleDashboardCard({ event }: { event: EventResponse }) {
  const [now, setNow] = useState(() => Date.now());
  const { data: schedules, isLoading: scheduleLoading } = useEventSchedule(event.id);
  const { data: rounds, isLoading: roundsLoading } = useQuery({
    queryKey: ["event-rounds", event.id],
    queryFn: () => roundApi.list(event.id),
    enabled: !!event.id,
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const prelimRound = rounds?.find((r) => r.roundType === "PRELIMINARY") ?? rounds?.[0];
  const activeMilestone = findActiveMilestone(schedules, now);
  const nextMilestone = schedules ? findNextMilestone(schedules, now) : undefined;
  const countdownTarget = activeMilestone?.gate
    ? getGateDeadlineFromRound(activeMilestone.gate, prelimRound)
    : nextMilestone?.startTime ?? null;
  const countdownMs = countdownTarget ? msUntil(countdownTarget, now) : null;

  if (scheduleLoading || roundsLoading) {
    return <SkeletonBlock height={180} />;
  }

  if (!schedules || schedules.length === 0) return null;

  return (
    <div className="border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-xl font-bold text-navy">Competition schedule</h2>
          <p className="mt-1 text-sm text-seal-text-secondary">{event.name}</p>
        </div>
        <Link
          href="/student/submissions"
          className="inline-flex items-center gap-1 font-mono text-xs font-bold text-seal-cyan hover:underline"
        >
          Submit
          <ArrowRightIcon />
        </Link>
      </div>

      {(activeMilestone || nextMilestone) && (
        <div className="mb-4 rounded-lg border border-seal-cyan/30 bg-seal-cyan/5 p-3 text-sm">
          {activeMilestone ? (
            <p className="font-semibold text-seal-cyan">In progress: {activeMilestone.title}</p>
          ) : nextMilestone ? (
            <p className="font-semibold text-seal-text">Next: {nextMilestone.title}</p>
          ) : null}
          {countdownMs !== null && countdownMs > 0 && (
            <p className="mt-1 font-mono text-xs text-seal-text-secondary">
              {formatCountdown(countdownMs)}
              {activeMilestone?.gate === "SLIDE_SUBMISSION" ? " until slide deadline" : activeMilestone?.gate === "DEMO_SUBMISSION" ? " until demo deadline" : " until next milestone"}
            </p>
          )}
        </div>
      )}

      <EventScheduleTimeline
        schedules={schedules}
        rounds={rounds}
        variant="compact"
        highlightTypes={["MILESTONE"]}
        preliminaryRound={prelimRound}
      />
    </div>
  );
}

function TeamQuickCard({ team }: { team: TeamResponse | null | undefined }) {
  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6 text-center shadow-sm">
        <div className="text-seal-text-muted">
          <TeamSmallIcon />
        </div>
        <p className="mt-4 text-base font-semibold text-seal-text">No team yet</p>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Join or create a team to get started.
        </p>
        <Link
          href="/student/teams"
          className="mt-4 inline-flex items-center justify-center border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-6 py-2.5 text-xs font-semibold text-seal-text transition-all duration-200 hover:border-royal/30 hover:bg-royal/5"
        >
          Browse Teams
        </Link>
      </div>
    );
  }

  const statusLabel =
    team.status === "CONFIRMED"
      ? "Confirmed"
      : team.status === "FORMING"
        ? "Forming"
        : team.status === "DISBANDED"
          ? "Disbanded"
          : team.status;

  return (
    <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
      <div className="border-b border-seal-border-light p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-seal-text">
            {team.name}
          </h2>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-seal-text-secondary">
            {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
          </span>
        </div>

        <div className="flex gap-2">
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              team.status === "CONFIRMED"
                ? "bg-seal-success/10 text-emerald-700"
                : "bg-seal-surface-elevated text-seal-text-secondary"
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="border-t border-seal-border-light bg-seal-surface-sunken p-4">
        <Link
          href="/student/teams"
          className="flex w-full items-center justify-center border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-4 py-2.5 text-xs font-semibold text-seal-text transition-all duration-200 hover:border-royal/30 hover:bg-royal/5"
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
  const { data: hackathons, isLoading: hackathonsLoading } = useDashboardHackathons();
  const activeEvent = hackathons?.find((e) => e.status === "ACTIVE" || e.status === "OPEN");
  const { data: team, isLoading: teamLoading } = useDashboardTeam(activeEvent?.id);
  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getAll({ size: 3 }),
  });

  const { data: activeEnrollment } = useMyActiveEnrollment();
  const { data: profile } = useProfile();

  const notifications = notifData?.content ?? [];
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  const sealScheduleEvent =
    hackathons?.find(
      (e) =>
        e.competitionFormat === "SEAL_RAG_2026" &&
        activeEnrollment?.eventId === e.id &&
        activeEnrollment?.status === "APPROVED",
    ) ??
    hackathons?.find((e) => e.competitionFormat === "SEAL_RAG_2026" && e.status === "ACTIVE");

  if (summaryLoading && teamLoading) {
    return (
      <div className="flex flex-col gap-6">
        <SkeletonBlock height={140} />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} height={160} />)}
        </div>
        <SkeletonBlock height={200} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner userName={firstName} />
      <StatsRow summary={summary} team={team} />

      {hackathonsLoading ? (
        <SkeletonBlock height={200} />
      ) : (
        <HackathonEvents
          hackathons={hackathons ?? []}
          activeEnrollment={activeEnrollment}
          profile={profile}
        />
      )}

      {sealScheduleEvent && <ScheduleDashboardCard event={sealScheduleEvent} />}

      <div className="grid gap-6" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <RecentUpdates notifications={notifications} />
        <TeamQuickCard team={team} />
      </div>
    </div>
  );
}
