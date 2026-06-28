import { PLATFORM_FEATURES } from "@/lib/landing-data";
import { GridBackground, SectionHeading } from "./landing-ui";

const FEATURE_ICONS = [
  <svg key="event" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>,
  <svg key="team" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>,
  <svg key="draw" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>,
  <svg key="judge" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16" />
    <path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>,
  <svg key="submit" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="16,18 22,12 16,6" />
    <polyline points="8,6 2,12 8,18" />
  </svg>,
  <svg key="rank" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>,
];

export function PlatformFeatures() {
  return (
    <section id="features" className="relative bg-white py-16 md:py-24">
      <GridBackground className="opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Platform Features"
          description="Everything you need to run and compete in hackathons, from registration through final rankings."
          align="center"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_FEATURES.map((feature, i) => (
            <article
              key={feature.title}
              className="border-2 border-navy bg-white p-5 shadow-[4px_4px_0_0_#0c1228]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center border-2 border-navy/20 bg-seal-surface-sunken text-royal">
                {FEATURE_ICONS[i]}
              </div>
              <h3 className="font-mono text-base font-bold text-navy">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-seal-text-secondary">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
