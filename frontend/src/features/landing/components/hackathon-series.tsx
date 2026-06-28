import { HACKATHON_SERIES } from "@/lib/landing-data";
import { SectionHeading } from "./landing-ui";

export function HackathonSeries() {
  return (
    <section id="series" className="bg-seal-surface-sunken py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Hackathon Series"
          description="Three annual SEAL hackathons, each with a distinct theme aligned to the academic calendar."
          align="center"
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {HACKATHON_SERIES.map((season) => (
            <article
              key={season.season}
              className="flex flex-col border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]"
            >
              <span
                className={`inline-flex w-fit border-2 px-3 py-1 font-mono text-xs font-bold uppercase ${season.accentClass} ${season.borderClass}`}
              >
                {season.season}
              </span>
              <h3 className="mt-4 font-mono text-lg font-bold text-navy">{season.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-seal-text-secondary">
                {season.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
