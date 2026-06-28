"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LandingNavbar } from "@/features/landing/components/landing-navbar";
import { Footer } from "@/features/landing/components/footer";
import { usePublicEvent, usePublicEventRounds } from "@/features/events/hooks/use-public-event";
import {
  calcTotalPrizePool,
  formatEventDate,
  formatEventDateTime,
  formatFormatLabel,
  formatSemesterRange,
  formatTeamSize,
  getStatusMeta,
} from "@/features/events/utils/event-landing.utils";
import { formatPrizeAmount, getPrizeLabel } from "@/lib/prize.utils";
import type { EventResponse } from "@/lib/api/event.api";
import type { PrizeRank } from "@/lib/api/event.api";
import type { RoundResponse } from "@/lib/api/round.api";

const SECTION_LINKS = [
  { id: "about", label: "About" },
  { id: "tracks", label: "Tracks" },
  { id: "schedule", label: "Schedule" },
  { id: "prizes", label: "Prizes" },
  { id: "guests", label: "Guests" },
] as const;

const TRACK_ACCENTS = [
  { border: "border-seal-cyan/30", text: "text-seal-cyan", bg: "from-seal-cyan/10 to-transparent" },
  { border: "border-seal-mint/30", text: "text-seal-mint", bg: "from-seal-mint/10 to-transparent" },
  { border: "border-royal/30", text: "text-royal", bg: "from-royal/10 to-transparent" },
  { border: "border-seal-blue/30", text: "text-seal-blue", bg: "from-seal-blue/10 to-transparent" },
];

const PRIZE_STYLES: Record<PrizeRank, { ring: string; text: string; height: string }> = {
  SECOND: { ring: "border-seal-text-secondary/30", text: "text-seal-text-secondary", height: "h-28" },
  FIRST: { ring: "border-seal-yellow/40", text: "text-seal-yellow", height: "h-36" },
  THIRD: { ring: "border-seal-orange/30", text: "text-seal-orange", height: "h-24" },
  CONSOLATION: { ring: "border-seal-border", text: "text-seal-text-secondary", height: "h-20" },
};

interface EventLandingPageProps {
  eventId: string;
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-seal-dark">
      <div className="h-16 animate-pulse bg-seal-dark-surface" />
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-6 h-16 w-3/4 animate-pulse rounded bg-white/10" />
        <div className="mt-8 h-12 w-96 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex min-h-screen flex-col bg-seal-bg">
      <LandingNavbar />
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-seal-cyan">404</p>
          <h1 className="mt-3 font-mono text-3xl font-bold text-navy">Event not found</h1>
          <p className="mt-3 text-seal-text-secondary">
            This hackathon may have been removed or is not yet published.
          </p>
          <Link
            href="/#featured"
            className="mt-8 inline-flex h-11 items-center border-2 border-navy bg-seal-yellow px-6 text-sm font-mono font-bold text-navy shadow-[4px_4px_0_0_#0c1228]"
          >
            Explore Events
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-2 border-white/20 bg-white/10 px-4 py-3 text-center">
      <p className="font-mono text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-seal-cyan/70">{label}</p>
    </div>
  );
}

function HeroSection({ event }: { event: EventResponse }) {
  const status = getStatusMeta(event.status);
  const isOpen = event.status === "OPEN";
  const semester = formatSemesterRange(event);
  const prizePool = calcTotalPrizePool(event.prizes);

  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-seal-dark pt-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(14,165,233,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-seal-cyan/10 blur-[120px]" aria-hidden="true" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 rounded-full bg-royal/10/10 blur-[100px]" aria-hidden="true" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-seal-cyan/5 seal-glow" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 pt-12">
          <span className="rounded border border-seal-cyan/20 bg-seal-cyan/10 px-3 py-1 font-mono text-xs font-semibold text-seal-cyan">
            {event.season} {event.year}
          </span>
          <span
            className={`rounded border px-3 py-1 font-mono text-xs font-semibold shadow-lg ${status.className} ${status.glow}`}
          >
            {status.label}
          </span>
        </div>

        <h1 className="mt-6 max-w-4xl font-mono text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
          <span className="seal-gradient-text">{event.name}</span>
        </h1>

        {event.description && (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            {event.description.length > 220 ? `${event.description.slice(0, 220)}…` : event.description}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <CalendarIcon />
            <span>{formatEventDate(event.startDate)} — {formatEventDate(event.endDate)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <LocationIcon />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <FormatIcon />
            <span>{formatFormatLabel(event.format)}</span>
          </div>
          {semester && (
            <div className="flex items-center gap-2">
              <AcademicIcon />
              <span>{semester}</span>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {isOpen ? (
            <Link
              href={`/hackathons/${event.id}/register`}
              className="inline-flex h-12 items-center border-2 border-navy bg-seal-yellow px-8 text-sm font-mono font-bold text-navy shadow-[4px_4px_0_0_#0c1228] transition-opacity hover:opacity-90"
            >
              Register Now
            </Link>
          ) : (
            <span className="inline-flex h-12 cursor-not-allowed items-center bg-white/10 px-8 text-sm font-semibold text-slate-400">
              Registration Closed
            </span>
          )}
          {(event.status === "ACTIVE" || event.status === "COMPLETED") && (
            <Link
              href={`/hackathons/${event.id}/livescore`}
              className="inline-flex h-12 items-center border-2 border-navy bg-seal-yellow px-8 text-sm font-mono font-bold text-navy shadow-[4px_4px_0_0_#0c1228]"
            >
              Live Scoreboard
            </Link>
          )}
          <a
            href="#about"
            className="inline-flex h-12 items-center border border-white/15 px-8 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            Explore Details
          </a>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-3xl">
          <StatPill label="Rounds" value={event.roundCount} />
          <StatPill label="Tracks" value={event.trackCount} />
          <StatPill label="Mentors" value={event.mentorCount} />
          <StatPill
            label="Prize Pool"
            value={prizePool > 0 ? `${Math.round(prizePool / 1_000_000)}M+` : "TBA"}
          />
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-seal-cyan/40" aria-hidden="true">
        <ChevronDownIcon />
      </div>
    </section>
  );
}

function SectionNav({ active, links }: { active: string; links: typeof SECTION_LINKS[number][] }) {
  return (
    <nav
      className="sticky top-16 z-40 border-b border-seal-border bg-seal-bg/90 backdrop-blur-md"
      aria-label="Event sections"
    >
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className={`shrink-0 rounded-lg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
              active === link.id
                ? "bg-seal-yellow text-navy font-mono font-bold"
                : "text-seal-text-secondary hover:bg-seal-surface-elevated hover:text-seal-text"
            }`}
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function SectionHeader({
  title,
  subtitle,
  dark,
}: {
  title: string;
  subtitle?: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-10">
      <h2 className={`font-mono text-3xl font-bold tracking-tight sm:text-4xl ${dark ? "text-white" : "text-seal-text"}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 max-w-2xl text-lg ${dark ? "text-slate-300" : "text-seal-text-secondary"}`}>
          {subtitle}
        </p>
      )}
      <div className="mt-5 h-px bg-gradient-to-r from-seal-cyan/50 via-seal-mint/30 to-transparent" />
    </div>
  );
}

function AboutSection({ event }: { event: EventResponse }) {
  return (
    <section id="about" className="scroll-mt-32 bg-seal-bg py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="About This Hackathon"
          subtitle="Everything you need to know before joining the mission."
        />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="border-2 border-navy bg-white p-8 shadow-[4px_4px_0_0_#0c1228]">
              <p className="whitespace-pre-line text-base leading-relaxed text-seal-text-secondary">
                {event.description ?? "Join innovators, builders, and creators for an unforgettable hackathon experience. Form your team, pick a track, and ship something remarkable."}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <InfoCard label="Team Size" value={formatTeamSize(event)} />
            <InfoCard label="Registration Deadline" value={formatEventDate(event.registrationDeadline)} />
            {event.registrationOpenDate && (
              <InfoCard label="Registration Opens" value={formatEventDate(event.registrationOpenDate)} />
            )}
            <InfoCard label="Competition Period" value={`${formatEventDate(event.startDate)} → ${formatEventDate(event.endDate)}`} />
            {event.tiebreakerCriteria && (
              <InfoCard label="Tiebreaker" value={event.tiebreakerCriteria} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-5">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-seal-cyan">{label}</p>
      <p className="mt-2 text-sm font-semibold text-seal-text">{value}</p>
    </div>
  );
}

function TracksSection({ event }: { event: EventResponse }) {
  if (event.tracks.length === 0) return null;

  return (
    <section id="tracks" className="scroll-mt-32 bg-seal-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Competition Tracks"
          subtitle="Choose the path that matches your team's strengths and ambition."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {event.tracks.map((track, i) => {
            const accent = TRACK_ACCENTS[i % TRACK_ACCENTS.length];
            return (
              <article
                key={track.id}
                className={`group relative overflow-hidden rounded-2xl border ${accent.border} bg-seal-bg p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.bg} opacity-60`} aria-hidden="true" />
                <div className="relative">
                  <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${accent.text}`}>
                    Track {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-mono text-xl font-bold text-seal-text">{track.name}</h3>
                  {track.description && (
                    <p className="mt-3 text-sm leading-relaxed text-seal-text-secondary">{track.description}</p>
                  )}
                  <div className="mt-5 flex items-center gap-2">
                    <span className="rounded bg-seal-surface-elevated px-2.5 py-1 font-mono text-[10px] font-semibold text-seal-text-secondary">
                      Max {track.maxTeams} teams
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ScheduleSection({ rounds }: { rounds: RoundResponse[] }) {
  if (rounds.length === 0) return null;

  const sorted = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);

  return (
    <section id="schedule" className="scroll-mt-32 bg-seal-bg py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Competition Schedule"
          subtitle="Mark your calendar — every round counts."
        />
        <div className="relative mx-auto max-w-3xl">
          <div className="absolute top-0 bottom-0 left-6 w-px bg-gradient-to-b from-seal-cyan/50 via-seal-mint/30 to-transparent" aria-hidden="true" />
          <div className="flex flex-col gap-8">
            {sorted.map((round) => (
              <div key={round.id} className="relative pl-16">
                <div className="absolute left-3 top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-seal-cyan bg-seal-bg font-mono text-xs font-bold text-seal-cyan">
                  {round.roundNumber}
                </div>
                <div className="border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]">
                  <h3 className="font-mono text-lg font-bold text-seal-text">{round.name}</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DeadlineRow label="Round Period" value={`${formatEventDateTime(round.startDate)} → ${formatEventDateTime(round.endDate)}`} />
                    <DeadlineRow label="Submission Deadline" value={formatEventDateTime(round.submissionDeadline)} highlight />
                    <DeadlineRow label="Scoring Deadline" value={formatEventDateTime(round.scoringDeadline)} />
                    <DeadlineRow label="Advancement Cutoff" value={`Top ${round.advancementCutoff} teams`} />
                  </div>
                  {round.criteria.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {round.criteria.map((c) => (
                        <span
                          key={c.id}
                          className="rounded-full border border-seal-border bg-seal-surface-elevated px-3 py-1 text-xs font-medium text-seal-text-secondary"
                        >
                          {c.name} ({c.weight}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DeadlineRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-seal-text-muted">{label}</p>
      <p className={`mt-1 text-sm font-medium ${highlight ? "text-seal-cyan" : "text-seal-text"}`}>{value}</p>
    </div>
  );
}

function PrizesSection({ event }: { event: EventResponse }) {
  if (event.prizes.length === 0) return null;

  const podiumRanks: PrizeRank[] = ["SECOND", "FIRST", "THIRD"];
  const podium = podiumRanks
    .map((rank) => event.prizes.find((p) => p.rank === rank && p.trackId == null))
    .filter(Boolean);
  const others = event.prizes.filter(
    (p) => !podiumRanks.includes(p.rank) || p.trackId != null,
  );

  return (
    <section id="prizes" className="scroll-mt-32 bg-seal-dark py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          dark
          title="Prizes & Rewards"
          subtitle="Outstanding teams deserve outstanding recognition."
        />
        {podium.length > 0 && (
          <div className="mb-10 flex items-end justify-center gap-4">
            {podiumRanks.map((rank) => {
              const prize = event.prizes.find((p) => p.rank === rank && p.trackId == null);
              if (!prize) return <div key={rank} className="w-28 sm:w-36" />;
              const style = PRIZE_STYLES[rank];
              return (
                <div key={rank} className="flex w-28 flex-col items-center sm:w-36">
                  <div
                    className={`flex w-full flex-col items-center justify-end rounded-t-2xl border-2 ${style.ring} ${style.height} bg-gradient-to-t from-white/5 to-transparent px-3 pb-4`}
                  >
                    <span className={`font-mono text-[10px] font-bold uppercase ${style.text}`}>
                      {getPrizeLabel(prize.rank, prize.label)}
                    </span>
                    <span className="mt-1 text-center font-mono text-sm font-bold text-white sm:text-base">
                      {formatPrizeAmount(prize.value)}
                    </span>
                    {prize.quantity > 1 && (
                      <span className="mt-0.5 font-mono text-[10px] text-slate-400">×{prize.quantity}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {others.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((prize) => {
              const trackName = prize.trackId
                ? event.tracks.find((t) => t.id === prize.trackId)?.name
                : null;
              return (
                <div
                  key={prize.id}
                  className="border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-seal-cyan">
                    {trackName ?? "Overall"}
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-white">
                    {getPrizeLabel(prize.rank, prize.label)}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-seal-mint">{formatPrizeAmount(prize.value)}</p>
                  {prize.quantity > 1 && (
                    <p className="mt-1 text-xs text-slate-400">{prize.quantity} winners</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function GuestsSection({ event }: { event: EventResponse }) {
  if (event.honoredGuests.length === 0) return null;

  return (
    <section id="guests" className="scroll-mt-32 bg-seal-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Honored Guests" subtitle="Leaders and experts joining us for this edition." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {event.honoredGuests.map((guest) => {
            const initials = guest.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <div
                key={guest.id}
                className="flex items-center gap-4 border-2 border-navy bg-white p-5 shadow-[4px_4px_0_0_#0c1228] transition-shadow hover:shadow-[6px_6px_0_0_#0c1228]"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-gradient-to-br from-seal-cyan/20 to-royal/20 font-mono text-lg font-bold text-seal-cyan">
                  {initials}
                </div>
                <div>
                  <p className="font-mono text-base font-bold text-seal-text">{guest.fullName}</p>
                  {guest.title && <p className="mt-0.5 text-sm text-seal-text-secondary">{guest.title}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RegisterCta({ event }: { event: EventResponse }) {
  const isOpen = event.status === "OPEN";

  return (
    <section className="relative overflow-hidden bg-seal-bg py-20">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="absolute h-80 w-80 rounded-full border border-seal-cyan/10 seal-glow" />
        <div className="absolute h-[420px] w-[420px] rounded-full border border-seal-mint/10 seal-glow" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div
          className="rounded-2xl border-2 border-seal-cyan/20 px-6 py-14 sm:px-12"
          style={{ clipPath: "polygon(0 0, 95% 0, 100% 5%, 100% 100%, 5% 100%, 0 95%)" }}
        >
          <h2 className="font-mono text-3xl font-bold text-navy sm:text-4xl">
            Ready to <span className="seal-gradient-text">compete</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-seal-text-secondary">
            {isOpen
              ? `Secure your spot in ${event.name} before registration closes on ${formatEventDate(event.registrationDeadline)}.`
              : "Registration is closed for this edition. Follow us for upcoming missions."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {isOpen ? (
              <Link
                href={`/hackathons/${event.id}/register`}
                className="inline-flex h-12 items-center border-2 border-navy bg-seal-yellow px-8 text-sm font-mono font-bold text-navy shadow-[4px_4px_0_0_#0c1228]"
              >
                Register Now
              </Link>
            ) : null}
            <Link
              href="/#featured"
              className="inline-flex h-12 items-center border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-8 text-sm font-semibold text-seal-text"
            >
              More Events
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function FormatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function AcademicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 2 3 4 6 4s6-2 6-4v-5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" />
    </svg>
  );
}

export function EventLandingPage({ eventId }: EventLandingPageProps) {
  const { data: event, isLoading, isError } = usePublicEvent(eventId);
  const { data: rounds = [] } = usePublicEventRounds(eventId);
  const [activeSection, setActiveSection] = useState("about");

  const visibleSections = useMemo(() => {
    if (!event) return [];
    return SECTION_LINKS.filter((s) => {
      if (s.id === "tracks") return event.tracks.length > 0;
      if (s.id === "schedule") return rounds.length > 0;
      if (s.id === "prizes") return event.prizes.length > 0;
      if (s.id === "guests") return event.honoredGuests.length > 0;
      return true;
    });
  }, [event, rounds]);

  useEffect(() => {
    const ids = visibleSections.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5] },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [visibleSections]);

  if (isLoading) return <PageSkeleton />;
  if (isError || !event) return <NotFoundState />;

  return (
    <div className="min-h-full bg-seal-bg">
      <LandingNavbar />
      <main>
        <HeroSection event={event} />
        <SectionNav active={activeSection} links={visibleSections} />
        <AboutSection event={event} />
        <TracksSection event={event} />
        <ScheduleSection rounds={rounds} />
        <PrizesSection event={event} />
        <GuestsSection event={event} />
        <RegisterCta event={event} />
      </main>
      <Footer />
    </div>
  );
}
