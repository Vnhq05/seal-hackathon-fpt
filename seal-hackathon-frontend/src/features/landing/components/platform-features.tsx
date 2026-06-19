import { PLATFORM_FEATURES } from "@/lib/landing-data";

const FEATURE_ICONS = [
  <svg key="discover" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
  </svg>,
  <svg key="team" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" strokeLinecap="round" />
  </svg>,
  <svg key="submit" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>,
  <svg key="mentor" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>,
  <svg key="judge" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>,
  <svg key="rank" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
];

const ACCENT_COLORS = [
  "text-seal-cyan border-seal-cyan/20",
  "text-seal-mint border-seal-mint/20",
  "text-seal-blue border-seal-blue/20",
  "text-seal-purple border-seal-purple/20",
  "text-seal-pink border-seal-pink/20",
  "text-seal-yellow border-seal-yellow/20",
];

export function PlatformFeatures() {
  return (
    <section id="platform" className="bg-seal-surface py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-seal-text sm:text-4xl">
            PLATFORM CONTROL DECK
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-seal-text-secondary">
            Everything you need to discover, build, and compete — in one place.
          </p>
        </div>

        {/* Dashboard frame */}
        <div className="relative mt-14 rounded-lg border border-seal-cyan/15 bg-seal-bg/60 p-6 sm:p-8">
          {/* Header bar */}
          <div className="mb-6 flex items-center gap-3 border-b border-seal-cyan/10 pb-4">
            <div className="h-2 w-2 rounded-full bg-seal-cyan" />
            <div className="h-2 w-2 rounded-full bg-seal-mint" />
            <div className="h-2 w-2 rounded-full bg-seal-yellow" />
            <span className="ml-2 font-mono text-[11px] uppercase tracking-widest text-seal-text-secondary/50">
              SEAL PLATFORM // SYSTEMS OVERVIEW
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="group rounded-lg border border-seal-surface-elevated bg-seal-surface p-5 transition-all duration-200 hover:border-seal-cyan/20 hover:bg-seal-surface-elevated"
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded border ${ACCENT_COLORS[i]}`}>
                  {FEATURE_ICONS[i]}
                </div>
                <h3 className="font-heading text-base font-bold text-seal-text">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-seal-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
