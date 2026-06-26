import Link from "next/link";

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-seal-bg py-20 md:py-28">
      {/* Background sonar/wave illustration */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="absolute h-96 w-96 rounded-full border border-seal-cyan/5 seal-glow" />
        <div className="absolute h-[500px] w-[500px] rounded-full border border-seal-mint/5 seal-glow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute h-[620px] w-[620px] rounded-full border border-seal-purple/5 seal-glow" style={{ animationDelay: "3s" }} />
      </div>

      {/* Gradient glow spots */}
      <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-seal-cyan/5 blur-3xl" />
      <div className="absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-seal-mint/5 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        {/* Poster-like frame */}
        <div
          className="relative rounded-lg border-2 border-seal-cyan/20 px-6 py-12 sm:px-12 sm:py-16"
          style={{
            clipPath: "polygon(0 0, 95% 0, 100% 5%, 100% 100%, 5% 100%, 0 95%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-lg opacity-30"
            style={{
              background: "linear-gradient(135deg, rgba(223,226,236,0.8), transparent 40%, rgba(130,240,192,0.1) 60%, transparent)",
            }}
            aria-hidden="true"
          />

          <h2 className="relative font-heading text-3xl font-bold tracking-tight text-seal-text sm:text-4xl lg:text-5xl">
            YOUR NEXT BIG IDEA
            <br />
            <span className="seal-gradient-text">STARTS HERE.</span>
          </h2>

          <p className="relative mx-auto mt-5 max-w-lg text-lg text-seal-text-secondary">
            Join the SEAL community and turn ambitious ideas into working products.
          </p>

          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#featured"
              className="inline-flex h-12 items-center rounded-lg bg-gradient-to-r from-seal-cyan to-seal-mint px-7 text-sm font-bold text-seal-bg transition-opacity hover:opacity-90 focus:ring-2 focus:ring-seal-cyan/40 focus:outline-none"
            >
              Explore Events
            </a>
            <Link
              href="/register"
              className="inline-flex h-12 items-center rounded-lg bg-seal-purple px-7 text-sm font-bold text-white transition-colors hover:bg-seal-purple-dark focus:ring-2 focus:ring-seal-purple/40 focus:outline-none"
            >
              Create Account
            </Link>
          </div>

          {/* Chevrons inside frame */}
          <div className="mt-6 flex items-center justify-center gap-6 text-seal-cyan/20" aria-hidden="true">
            <span className="font-mono text-xs tracking-tighter">&gt;&gt;&gt;&gt;&gt;&gt;</span>
            <div className="h-px w-12 bg-seal-cyan/20" />
            <span className="font-mono text-xs tracking-tighter">&lt;&lt;&lt;&lt;&lt;&lt;</span>
          </div>
        </div>
      </div>
    </section>
  );
}
