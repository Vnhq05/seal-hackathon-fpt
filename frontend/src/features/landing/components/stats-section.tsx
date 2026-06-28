import { STATS } from "@/lib/landing-data";

export function StatsSection() {
  return (
    <section id="about" className="relative border-y-2 border-navy/10 bg-white py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="border-2 border-navy/15 bg-seal-surface-sunken px-4 py-6 text-center shadow-[4px_4px_0_0_rgba(12,18,40,0.08)]"
            >
              <p className="font-mono text-3xl font-bold text-navy sm:text-4xl lg:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 font-mono text-xs font-semibold uppercase tracking-wider text-seal-text-secondary">
                {stat.label}
              </p>
              {stat.detail ? (
                <p className="mt-1 font-mono text-[10px] text-seal-text-muted">{stat.detail}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
