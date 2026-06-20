"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api/public.api";
import type { EventResponse } from "@/lib/api/event.api";

const ACCENT_KEYS = ["cyan", "mint", "purple", "blue", "pink", "yellow"] as const;
const ACCENT_MAP: Record<string, { border: string; text: string; bg: string; glow: string }> = {
  cyan: {
    border: "border-seal-cyan/30",
    text: "text-seal-cyan",
    bg: "bg-seal-cyan/10",
    glow: "hover:shadow-seal-cyan/10",
  },
  mint: {
    border: "border-seal-mint/30",
    text: "text-seal-mint",
    bg: "bg-seal-mint/10",
    glow: "hover:shadow-seal-mint/10",
  },
  purple: {
    border: "border-seal-purple/30",
    text: "text-seal-purple",
    bg: "bg-seal-purple/10",
    glow: "hover:shadow-seal-purple/10",
  },
  blue: {
    border: "border-seal-blue/30",
    text: "text-seal-blue",
    bg: "bg-seal-blue/10",
    glow: "hover:shadow-seal-blue/10",
  },
  pink: {
    border: "border-seal-pink/30",
    text: "text-seal-pink",
    bg: "bg-seal-pink/10",
    glow: "hover:shadow-seal-pink/10",
  },
  yellow: {
    border: "border-seal-yellow/30",
    text: "text-seal-yellow",
    bg: "bg-seal-yellow/10",
    glow: "hover:shadow-seal-yellow/10",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function EventCard({ event, index }: { event: EventResponse; index: number }) {
  const accentKey = ACCENT_KEYS[index % ACCENT_KEYS.length];
  const accent = ACCENT_MAP[accentKey];
  const isOpen = new Date(event.registrationDeadline) >= new Date();

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-lg border ${accent.border} bg-seal-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${accent.glow} focus-within:ring-2 focus-within:ring-seal-cyan/30`}
    >
      <div className="relative h-36 overflow-hidden bg-seal-bg">
        <div className="absolute top-0 right-0 grid grid-cols-2 gap-0 opacity-15" aria-hidden="true">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-4 w-4 ${i % 2 === 0 ? accent.bg : "bg-transparent"}`} />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <div className="h-px bg-gradient-to-r from-transparent via-seal-cyan/40 to-transparent" />
          <div className="flex items-center justify-between px-4 py-2">
            <span className={`font-mono text-[10px] uppercase tracking-wider ${accent.text}`}>
              {event.season} {event.year}
            </span>
            <span className="font-mono text-[10px] tracking-tighter text-seal-text-secondary/40" aria-hidden="true">
              &gt;&gt;&gt;&gt;
            </span>
          </div>
        </div>
        <div className="flex h-full items-center px-4">
          <h3 className="font-heading text-lg font-bold leading-tight text-seal-text">{event.name}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${
              isOpen ? "bg-seal-mint/15 text-seal-mint" : "bg-seal-text-secondary/10 text-seal-text-secondary"
            }`}
            role="status"
          >
            {isOpen ? "Open" : "Closed"}
          </span>
          <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-medium ${accent.bg} ${accent.text}`}>
            {event.roundCount} round{event.roundCount !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-seal-text-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="font-mono text-xs">
              {formatDate(event.startDate)} — {formatDate(event.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-seal-text-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 8v4l3 3" strokeLinecap="round" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="font-mono text-xs">
              Deadline: {formatDate(event.registrationDeadline)}
            </span>
          </div>
        </div>

        <div className="mt-auto flex gap-2 pt-4">
          <Link
            href={`/hackathons/${event.id}`}
            className={`inline-flex h-9 flex-1 items-center justify-center rounded border ${accent.border} font-mono text-xs font-semibold ${accent.text} transition-colors hover:bg-seal-surface-elevated focus:ring-2 focus:ring-seal-cyan/30 focus:outline-none`}
          >
            View Event
          </Link>
          {isOpen ? (
            <Link
              href={`/hackathons/${event.id}/register`}
              className="inline-flex h-9 flex-1 items-center justify-center rounded bg-gradient-to-r from-seal-cyan to-seal-mint font-mono text-xs font-bold text-seal-bg transition-opacity hover:opacity-90 focus:ring-2 focus:ring-seal-cyan/40 focus:outline-none"
            >
              Register Now
            </Link>
          ) : (
            <span className="inline-flex h-9 flex-1 cursor-not-allowed items-center justify-center rounded bg-seal-text-secondary/10 font-mono text-xs font-medium text-seal-text-secondary/50">
              Registration Closed
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function EventCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-seal-border bg-seal-surface">
      <div className="h-36 bg-seal-bg" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-16 rounded bg-seal-border" />
        <div className="h-3 w-full rounded bg-seal-border" />
        <div className="h-3 w-3/4 rounded bg-seal-border" />
        <div className="flex gap-2 pt-2">
          <div className="h-9 flex-1 rounded bg-seal-border" />
          <div className="h-9 flex-1 rounded bg-seal-border" />
        </div>
      </div>
    </div>
  );
}

export function Hackathons() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-events"],
    queryFn: () => publicApi.listActiveEvents({ size: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const events = data?.content ?? [];

  return (
    <section id="featured" className="bg-seal-bg py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-seal-text sm:text-4xl">
              FEATURED MISSIONS
            </h2>
            <p className="mt-3 text-lg text-seal-text-secondary">
              Choose a challenge and start building.
            </p>
          </div>
          <span className="hidden font-mono text-sm tracking-tighter text-seal-cyan/30 sm:block" aria-hidden="true">
            &gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;
          </span>
        </div>

        <div className="h-px bg-gradient-to-r from-seal-cyan/40 via-seal-mint/20 to-transparent mt-6" />

        {isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <div className="mt-10 rounded-lg border border-seal-border bg-seal-surface p-12 text-center">
            <p className="font-heading text-xl font-bold text-seal-text">No active events right now</p>
            <p className="mt-2 text-seal-text-secondary">Check back soon for upcoming hackathons.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
