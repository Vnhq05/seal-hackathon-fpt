import Image from "next/image";

export function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
      {/* Background illustration */}
      <Image
        src="/brand-bg.png"
        alt=""
        fill
        className="object-cover object-center opacity-30"
        priority
        aria-hidden="true"
      />

      {/* Gradient overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 80%, rgba(14,165,233,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(99,102,241,0.10) 0%, transparent 50%)",
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(14,165,233,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      {/* Animated orb */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full seal-breathe" style={{ background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)" }} aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-10 lg:p-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-seal-cyan/15 to-seal-blue/10 ring-1 ring-white/10">
            <Image src="/logo-removebg-preview.png" alt="SEAL Hackathon" width={32} height={32} className="brightness-0 invert" />
          </div>
          <span className="text-2xl font-bold tracking-wide text-white">
            SEAL <span className="text-seal-cyan-light">Hackathon</span>
          </span>
        </div>

        {/* Headline */}
        <div className="max-w-md">
          <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.3em] text-seal-cyan/60">
            Hackathon Management Platform
          </p>
          <h1 className="text-[40px] font-bold leading-[1.08] tracking-tight text-white">
            Run your hackathon.
            <br />
            <span className="seal-gradient-text-ocean">End to end.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-400">
            Organize, judge, and manage competitions with a platform built for innovation.
          </p>

          {/* Trust badges */}
          <div className="mt-8 flex gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-seal-cyan/10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
              <span className="text-xs font-medium text-slate-400">Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-seal-blue/10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" /></svg>
              </div>
              <span className="text-xs font-medium text-slate-400">Fast</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-seal-mint/10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
              </div>
              <span className="text-xs font-medium text-slate-400">Reliable</span>
            </div>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-seal-cyan/20 to-transparent" />
          <span className="font-mono text-[10px] tracking-widest text-slate-600">
            SEAL PLATFORM v4.0
          </span>
        </div>
      </div>
    </div>
  );
}
