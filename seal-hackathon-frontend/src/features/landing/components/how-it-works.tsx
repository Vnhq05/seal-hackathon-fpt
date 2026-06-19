import { HOW_IT_WORKS_STEPS } from "@/lib/landing-data";

const STEP_ICONS = [
  <svg key="discover" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
  </svg>,
  <svg key="crew" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
  </svg>,
  <svg key="build" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="16,18 22,12 16,6" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="8,6 2,12 8,18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  <svg key="launch" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
];

const ACCENT_COLORS = ["text-seal-cyan", "text-seal-mint", "text-seal-yellow", "text-seal-orange"];
const BG_COLORS = ["bg-seal-cyan/10", "bg-seal-mint/10", "bg-seal-yellow/10", "bg-seal-orange/10"];
const BORDER_COLORS = ["border-seal-cyan/20", "border-seal-mint/20", "border-seal-yellow/20", "border-seal-orange/20"];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-seal-surface py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-seal-text sm:text-4xl">
            FROM IDEA TO IMPACT
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-seal-text-secondary">
            Four steps from discovery to launch.
          </p>
        </div>

        {/* Desktop: horizontal sci-fi timeline */}
        <div className="relative mt-16">
          {/* Connector line */}
          <div className="absolute top-10 right-0 left-0 hidden h-px lg:block">
            <div className="h-full bg-gradient-to-r from-seal-cyan/40 via-seal-mint/30 to-seal-orange/40" />
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Step node */}
                <div className={`relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-lg border ${BORDER_COLORS[i]} ${BG_COLORS[i]} lg:mx-0`}>
                  <div className={ACCENT_COLORS[i]}>{STEP_ICONS[i]}</div>
                  {/* Dot on timeline */}
                  <div className={`absolute -bottom-3 left-1/2 hidden h-2.5 w-2.5 -translate-x-1/2 rounded-full lg:block ${BG_COLORS[i].replace("/10", "")}`}
                    style={{ backgroundColor: i === 0 ? "#38bdf8" : i === 1 ? "#2dd4bf" : i === 2 ? "#f3d44d" : "#f28a32" }}
                  />
                </div>

                <span className={`font-mono text-xs font-bold tracking-wider ${ACCENT_COLORS[i]}`}>
                  STEP {step.num}
                </span>
                <h3 className="mt-2 font-heading text-xl font-bold text-seal-text">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-seal-text-secondary">
                  {step.description}
                </p>

                {/* Mobile vertical connector */}
                {i < 3 && (
                  <div className="mx-auto my-4 h-8 w-px bg-gradient-to-b from-seal-cyan/20 to-transparent sm:hidden" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
