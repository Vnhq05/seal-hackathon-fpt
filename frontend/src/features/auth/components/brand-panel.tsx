import Image from "next/image";
import { GridBackground, PixelLogo } from "@/shared/ui/seal-logo";

export function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-navy lg:flex lg:w-1/2 lg:flex-col">
      <GridBackground className="opacity-40" />

      <Image
        src="/brand-bg.png"
        alt=""
        fill
        className="object-cover object-center opacity-20"
        priority
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-10 lg:p-14">
        <PixelLogo size="md" variant="dark" />

        <div className="max-w-md">
          <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.3em] text-seal-yellow/70">
            Hackathon Management Platform
          </p>
          <h1 className="font-mono text-[40px] font-bold leading-[1.08] tracking-tight text-white">
            Run your hackathon.
            <br />
            <span className="text-seal-yellow">End to end.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-white/60">
            Organize, judge, and manage competitions with a platform built for innovation.
          </p>

          <div className="mt-8 flex gap-4">
            {[
              { label: "Secure", color: "bg-royal" },
              { label: "Fast", color: "bg-seal-yellow" },
              { label: "Reliable", color: "bg-seal-success" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 border-2 border-white/10 bg-white/5 px-3 py-2">
                <span className={`h-2.5 w-2.5 ${badge.color}`} aria-hidden="true" />
                <span className="font-mono text-[10px] font-bold uppercase text-white/70">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-seal-yellow/30 to-transparent" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/40">
            FPT University HCMC
          </span>
        </div>
      </div>
    </div>
  );
}
