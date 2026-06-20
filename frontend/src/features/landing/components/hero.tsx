"use client";

function CyberSealMascot() {
  return (
    <div className="relative">
      <div className="seal-float relative z-10">
        <svg
          width="320"
          height="360"
          viewBox="0 0 320 360"
          fill="none"
          aria-hidden="true"
          className="mx-auto w-full max-w-[320px]"
        >
          {/* Body */}
          <ellipse cx="160" cy="200" rx="80" ry="100" fill="url(#seal-body)" />
          {/* Helmet visor */}
          <ellipse cx="160" cy="155" rx="60" ry="50" fill="#0e1528" stroke="#38bdf8" strokeWidth="2" />
          <ellipse cx="160" cy="155" rx="55" ry="45" fill="url(#seal-visor)" opacity="0.7" />
          {/* Eyes */}
          <circle cx="140" cy="150" r="8" fill="#38bdf8" />
          <circle cx="180" cy="150" r="8" fill="#38bdf8" />
          <circle cx="142" cy="148" r="3" fill="#ffffff" />
          <circle cx="182" cy="148" r="3" fill="#ffffff" />
          {/* Nose/snout */}
          <ellipse cx="160" cy="170" rx="12" ry="7" fill="#2dd4bf" opacity="0.4" />
          {/* Whiskers */}
          <line x1="120" y1="168" x2="95" y2="162" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.5" />
          <line x1="120" y1="175" x2="90" y2="178" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.5" />
          <line x1="200" y1="168" x2="225" y2="162" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.5" />
          <line x1="200" y1="175" x2="230" y2="178" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.5" />
          {/* Tech suit lines */}
          <path d="M110 220 L100 280" stroke="#38bdf8" strokeWidth="1" opacity="0.4" />
          <path d="M210 220 L220 280" stroke="#38bdf8" strokeWidth="1" opacity="0.4" />
          <path d="M130 240 L160 260 L190 240" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.3" fill="none" />
          {/* Flippers */}
          <ellipse cx="90" cy="230" rx="25" ry="12" fill="url(#seal-body)" transform="rotate(-20 90 230)" />
          <ellipse cx="230" cy="230" rx="25" ry="12" fill="url(#seal-body)" transform="rotate(20 230 230)" />
          {/* Tail */}
          <ellipse cx="160" cy="305" rx="30" ry="15" fill="url(#seal-body)" opacity="0.8" />
          {/* Helmet antenna */}
          <line x1="160" y1="105" x2="160" y2="85" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="160" cy="82" r="4" fill="#38bdf8" className="seal-glow" />
          {/* Chest badge */}
          <circle cx="160" cy="215" r="12" fill="#0e1528" stroke="#2dd4bf" strokeWidth="1.5" />
          <text x="160" y="220" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontFamily="monospace" fontWeight="bold">S</text>
          <defs>
            <linearGradient id="seal-body" x1="80" y1="100" x2="240" y2="310">
              <stop stopColor="#14233a" />
              <stop offset="0.5" stopColor="#0d1a30" />
              <stop offset="1" stopColor="#081425" />
            </linearGradient>
            <linearGradient id="seal-visor" x1="100" y1="110" x2="220" y2="200">
              <stop stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="1" stopColor="#818cf8" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Holographic wave rings */}
      <div className="absolute top-1/2 left-1/2 -z-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-seal-cyan/20 seal-glow" />
      <div className="absolute top-1/2 left-1/2 -z-0 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-seal-mint/10 seal-glow" style={{ animationDelay: "1s" }} />

      {/* Floating labels */}
      <div className="absolute top-8 right-0 rounded border border-seal-cyan/20 bg-seal-surface/80 px-2 py-1 font-mono text-[10px] text-seal-cyan backdrop-blur-sm">
        Build
      </div>
      <div className="absolute top-1/3 left-0 rounded border border-seal-mint/20 bg-seal-surface/80 px-2 py-1 font-mono text-[10px] text-seal-mint backdrop-blur-sm">
        Collaborate
      </div>
      <div className="absolute right-4 bottom-1/4 rounded border border-seal-purple/20 bg-seal-surface/80 px-2 py-1 font-mono text-[10px] text-seal-purple backdrop-blur-sm">
        Compete
      </div>
      <div className="absolute bottom-12 left-8 rounded border border-seal-yellow/20 bg-seal-surface/80 px-2 py-1 font-mono text-[10px] text-seal-yellow backdrop-blur-sm">
        Launch
      </div>
    </div>
  );
}

function ChevronDecoration({ className }: { className?: string }) {
  return (
    <span className={`font-mono text-sm tracking-tighter opacity-40 ${className ?? ""}`} aria-hidden="true">
      &gt;&gt;&gt;&gt;&gt;&gt;
    </span>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-seal-bg pt-16">
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(14,165,233,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      {/* Top-left checkerboard */}
      <div className="absolute top-0 left-0 grid grid-cols-3 gap-0 opacity-20" aria-hidden="true">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className={`h-6 w-6 sm:h-8 sm:w-8 ${i % 2 === 0 ? "bg-seal-cyan" : "bg-transparent"}`}
          />
        ))}
      </div>

      {/* Bottom-right checkerboard */}
      <div className="absolute right-0 bottom-0 grid grid-cols-3 gap-0 opacity-20" aria-hidden="true">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className={`h-6 w-6 sm:h-8 sm:w-8 ${i % 2 === 0 ? "bg-seal-mint" : "bg-transparent"}`}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-32">
        {/* Left — text content */}
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-seal-cyan">
              SEAL // HACKATHON NETWORK
            </span>
            <ChevronDecoration className="text-seal-cyan" />
          </div>

          <h1 className="mt-6 font-heading text-4xl leading-[1.05] font-bold tracking-tight text-seal-text sm:text-5xl lg:text-6xl xl:text-7xl">
            MAKE WAVES.
            <br />
            <span className="seal-gradient-text">BUILD THE FUTURE.</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-seal-text-secondary sm:text-xl">
            Discover hackathons, build ambitious ideas and compete with the next generation of
            creators.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#featured"
              className="inline-flex h-12 items-center rounded-lg bg-gradient-to-r from-seal-cyan to-seal-mint px-7 text-sm font-bold text-seal-bg transition-opacity hover:opacity-90 focus:ring-2 focus:ring-seal-cyan/40 focus:outline-none"
            >
              Explore Hackathons
            </a>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center rounded-lg border border-seal-text-secondary/20 px-7 text-sm font-semibold text-seal-text transition-colors hover:border-seal-cyan/40 hover:bg-seal-cyan/5 focus:ring-2 focus:ring-seal-cyan/20 focus:outline-none"
            >
              How It Works
            </a>
          </div>

          {/* Scroll prompt */}
          <div className="mt-10 flex items-center gap-2 text-seal-text-secondary/50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-mono text-[10px] uppercase tracking-wider">Scroll to explore</span>
          </div>
        </div>

        {/* Right — mascot visual */}
        <div className="relative hidden lg:block" aria-hidden="true">
          {/* Angular poster frame */}
          <div className="relative rounded-lg border-2 border-seal-cyan/20 bg-seal-surface/40 p-8"
            style={{
              clipPath: "polygon(0 0, 95% 0, 100% 5%, 100% 100%, 5% 100%, 0 95%)",
            }}
          >
            <div
              className="absolute inset-0 rounded-lg opacity-40"
              style={{
                background: "linear-gradient(135deg, rgba(14,165,233,0.08), transparent 50%, rgba(45,212,191,0.08))",
              }}
            />
            <CyberSealMascot />

            {/* Chevron bottom bar */}
            <div className="mt-4 flex items-center justify-between text-seal-cyan/40">
              <ChevronDecoration className="text-seal-cyan" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-seal-text-secondary/50">
                SEAL PLATFORM v4.0
              </span>
              <span className="font-mono text-sm tracking-tighter opacity-40" aria-hidden="true">
                &lt;&lt;&lt;&lt;&lt;&lt;
              </span>
            </div>
          </div>

          {/* Gradient border glow */}
          <div
            className="pointer-events-none absolute -inset-px rounded-lg seal-glow"
            style={{
              background: "linear-gradient(90deg, #38bdf8, #2dd4bf, #fbbf24, #f9e8b8)",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              padding: "2px",
              opacity: 0.3,
            }}
          />
        </div>

        {/* Mobile mascot (simplified) */}
        <div className="relative mx-auto max-w-xs lg:hidden" aria-hidden="true">
          <div className="rounded-lg border border-seal-cyan/20 bg-seal-surface/40 p-6">
            <CyberSealMascot />
          </div>
        </div>
      </div>
    </section>
  );
}
