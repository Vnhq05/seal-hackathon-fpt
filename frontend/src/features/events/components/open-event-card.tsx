"use client";

import Link from "next/link";
import type { EventResponse } from "@/lib/api/event.api";
import { getPrizeLabel } from "@/lib/prize.utils";
import { resolveFileUrl } from "@/lib/files";
import {
  displayOrUpdating,
  formatEventMetaFooter,
  formatLocationRow,
  formatOpeningDate,
  formatRegistrationPeriod,
  PARTICIPATION_NOTE,
  sortPrizesForDisplay,
} from "@/features/landing/utils/featured-event.utils";
import { PixelButton } from "@/features/landing/components/landing-ui";

const PRIZE_MEDALS = ["🥇", "🥈", "🥉", "🎖"];

interface OpenEventCardProps {
  event: EventResponse;
}

/** Shared template for open registration events (landing and any open-event list). */
export function OpenEventCard({ event }: OpenEventCardProps) {
  const prizes = sortPrizesForDisplay(event.prizes ?? []);
  const avatarSrc = resolveFileUrl(event.avatarUrl);

  return (
    <article className="border-2 border-navy bg-white shadow-[6px_6px_0_0_#0c1228]">
      <div className="border-b-2 border-navy/15 bg-seal-surface-sunken px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-4">
            {avatarSrc && (
              <img
                src={avatarSrc}
                alt=""
                className="h-14 w-14 shrink-0 border-2 border-navy object-cover"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-mono text-xl font-bold text-navy sm:text-2xl">
                {displayOrUpdating(event.name)}
              </h3>
            </div>
          </div>
          <span
            className="shrink-0 border border-royal/30 bg-royal/10 px-3 py-1 font-mono text-[10px] font-bold uppercase text-royal"
            role="status"
          >
            Registration Open
          </span>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-5">
        <div className="space-y-4 border-b-2 border-navy/10 p-5 sm:p-6 lg:col-span-3 lg:border-b-0 lg:border-r-2">
          <dl className="space-y-3">
            <div>
              <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-seal-text-muted">
                Registration
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-navy">
                {formatRegistrationPeriod(
                  event.registrationOpenDate,
                  event.registrationDeadline,
                )}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-seal-text-muted">
                Opening & Draw
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-navy">
                {formatOpeningDate(event.startDate)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-seal-text-muted">
                Competition Day
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-navy">Updating</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-seal-text-muted">
                Location
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-navy">
                {formatLocationRow(event.location, event.format)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-seal-surface-sunken/50 p-5 sm:p-6 lg:col-span-2">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-navy">Prizes</h4>
          <ul className="mt-3 space-y-2">
            {prizes.length === 0 ? (
              <li className="flex items-start gap-2 border border-navy/10 bg-white px-3 py-2 font-mono text-xs text-navy">
                <span aria-hidden="true">•</span>
                <span>Updating</span>
              </li>
            ) : (
              prizes.map((prize, i) => (
                <li
                  key={prize.id}
                  className="flex items-start gap-2 border border-navy/10 bg-white px-3 py-2 font-mono text-xs text-navy"
                >
                  <span aria-hidden="true">{PRIZE_MEDALS[i] ?? "•"}</span>
                  <span>
                    <span className="font-bold">
                      {getPrizeLabel(prize.rank, prize.label)}:
                    </span>{" "}
                    {displayOrUpdating(prize.value)}
                  </span>
                </li>
              ))
            )}
          </ul>
          <p className="mt-3 font-mono text-[11px] text-seal-text-secondary">
            {PARTICIPATION_NOTE}
          </p>
        </div>
      </div>

      <div className="border-t-2 border-navy/10 p-5 sm:flex sm:items-center sm:justify-between sm:px-6">
        <p className="font-mono text-xs text-seal-text-muted">
          {formatEventMetaFooter(event.minTeam, event.maxTeam, event.trackCount)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
          <PixelButton href={`/hackathons/${event.id}/register`} className="h-10 px-5 text-xs">
            Register Now
          </PixelButton>
          <Link
            href={`/hackathons/${event.id}`}
            className="inline-flex h-10 items-center justify-center border-2 border-navy bg-white px-5 font-mono text-xs font-bold text-navy shadow-[3px_3px_0_0_#0c1228] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#0c1228]"
          >
            Learn More
          </Link>
        </div>
      </div>
    </article>
  );
}
