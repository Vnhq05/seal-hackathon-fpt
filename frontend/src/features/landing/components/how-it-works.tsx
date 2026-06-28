import { HOW_IT_WORKS_STEPS } from "@/lib/landing-data";
import { SectionHeading } from "./landing-ui";

const STEP_COLORS = [
  "bg-royal/10 text-royal border-royal/30",
  "bg-seal-success/10 text-seal-success border-seal-success/30",
  "bg-seal-yellow/20 text-navy border-navy/30",
  "bg-seal-error/10 text-seal-error border-seal-error/30",
];

const STEP_ICONS = [
  <svg key="register" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>,
  <svg key="draw" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
  </svg>,
  <svg key="build" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="16,18 22,12 16,6" />
    <polyline points="8,6 2,12 8,18" />
  </svg>,
  <svg key="win" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16" />
    <path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </svg>,
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-seal-surface-sunken py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="How It Works"
          description="A four-step flow from team registration through finals and recognition."
          align="center"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <div
              key={step.title}
              className="border-2 border-navy bg-white p-5 shadow-[4px_4px_0_0_#0c1228]"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center border-2 ${STEP_COLORS[i]}`}
              >
                {STEP_ICONS[i]}
              </div>
              <h3 className="font-mono text-base font-bold text-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-seal-text-secondary">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
