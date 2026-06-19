import { STATS } from "@/lib/landing-data";

export function Stats() {
  return (
    <section className="relative overflow-hidden bg-seal-bg py-16 md:py-20">
      {/* Gradient line */}
      <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-seal-cyan/30 to-transparent" />
      <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-seal-mint/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Demo statistics */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-4xl font-bold text-seal-text sm:text-5xl lg:text-6xl">
                {stat.value}
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-seal-text-secondary">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
