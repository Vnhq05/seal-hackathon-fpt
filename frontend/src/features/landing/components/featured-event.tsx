"use client";

import { useFeaturedOpenEvents } from "@/features/landing/hooks/use-featured-open-events";
import { OpenEventCard } from "@/features/events/components/open-event-card";
import { GridBackground, SectionHeading } from "./landing-ui";

export function FeaturedEvent() {
  const { data: openEvents, isLoading, isError } = useFeaturedOpenEvents();
  const events = openEvents ?? [];
  const showEmpty = !isLoading && (isError || events.length === 0);

  return (
    <section id="featured" className="relative scroll-mt-20 bg-white py-16 md:py-24">
      <GridBackground className="opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Featured Event"
          description="The current SEAL Hackathon season is open for registration. Join teams building domain-specific AI RAG systems."
        />

        <div className="mt-10 space-y-6">
          {isLoading && (
            <div
              className="h-48 animate-pulse border-2 border-navy/15 bg-seal-surface-sunken"
              aria-busy="true"
              aria-label="Loading featured events"
            />
          )}

          {!isLoading &&
            events.map((event) => <OpenEventCard key={event.id} event={event} />)}

          {showEmpty && (
            <p className="border-2 border-navy/15 bg-seal-surface-sunken px-5 py-8 text-center font-mono text-sm text-seal-text-secondary">
              No hackathons are open for registration right now. Check back soon.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
