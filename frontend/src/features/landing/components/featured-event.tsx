"use client";

import Link from "next/link";
import { FEATURED_EVENT } from "@/lib/landing-data";
import { useFeaturedSealEvent } from "@/features/landing/hooks/use-featured-seal-event";
import { GridBackground, PixelButton, SectionHeading } from "./landing-ui";

const PRIZE_MEDALS = ["🥇", "🥈", "🥉", "🎖"];

export function FeaturedEvent() {
  const event = FEATURED_EVENT;
  const { data: featured } = useFeaturedSealEvent();
  const eventId = featured?.eventId ?? String(event.id);

  return (
    <section id="featured" className="relative bg-white py-16 md:py-24">
      <GridBackground className="opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Featured Event"
          description="The current SEAL Hackathon season is open for registration. Join teams building domain-specific AI RAG systems."
        />

        <article className="mt-10 border-2 border-navy bg-white shadow-[6px_6px_0_0_#0c1228]">
          <div className="border-b-2 border-navy/15 bg-seal-surface-sunken px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-mono text-xl font-bold text-navy sm:text-2xl">{event.name}</h3>
                <p className="mt-1 font-mono text-sm font-semibold text-royal">{event.theme}</p>
              </div>
              <span
                className="shrink-0 border border-royal/30 bg-royal/10 px-3 py-1 font-mono text-[10px] font-bold uppercase text-royal"
                role="status"
              >
                {event.statusLabel}
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
                  <dd className="mt-0.5 font-mono text-sm text-navy">{event.registrationPeriod}</dd>
                </div>
                {event.workshop ? (
                  <div>
                    <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-seal-text-muted">
                      Workshop
                    </dt>
                    <dd className="mt-0.5 font-mono text-sm text-navy">
                      {event.workshop.date} - {event.workshop.title}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-seal-text-muted">
                    Opening & Draw
                  </dt>
                  <dd className="mt-0.5 font-mono text-sm text-navy">{event.openingDate}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-seal-text-muted">
                    Competition Day
                  </dt>
                  <dd className="mt-0.5 font-mono text-sm text-navy">{event.competitionDay}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-seal-text-muted">
                    Location
                  </dt>
                  <dd className="mt-0.5 font-mono text-sm text-navy">
                    {event.location} ({event.format})
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-seal-surface-sunken/50 p-5 sm:p-6 lg:col-span-2">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-navy">Prizes</h4>
              <ul className="mt-3 space-y-2">
                {event.prizes.map((prize, i) => (
                  <li
                    key={prize.place}
                    className="flex items-start gap-2 border border-navy/10 bg-white px-3 py-2 font-mono text-xs text-navy"
                  >
                    <span aria-hidden="true">{PRIZE_MEDALS[i] ?? "•"}</span>
                    <span>
                      <span className="font-bold">{prize.place}:</span> {prize.reward}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-mono text-[11px] text-seal-text-secondary">
                {event.participationNote}
              </p>
            </div>
          </div>

          <div className="border-t-2 border-navy/10 p-5 sm:flex sm:items-center sm:justify-between sm:px-6">
            <p className="font-mono text-xs text-seal-text-muted">
              Teams of 3–5 members · 3 technology tracks · Top 6 advance to finals
            </p>
            <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
              <PixelButton href={`/hackathons/${eventId}/register`} className="h-10 px-5 text-xs">
                Register Now
              </PixelButton>
              <Link
                href={`/hackathons/${eventId}`}
                className="inline-flex h-10 items-center justify-center border-2 border-navy bg-white px-5 font-mono text-xs font-bold text-navy shadow-[3px_3px_0_0_#0c1228] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#0c1228]"
              >
                Learn More
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
