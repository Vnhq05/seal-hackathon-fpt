import { CTA_DEADLINE } from "@/lib/landing-data";
import { PixelButton } from "./landing-ui";

export function CTASection() {
  return (
    <section id="cta" className="relative overflow-hidden border-y-2 border-navy bg-seal-yellow py-16 md:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(12,18,40,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(12,18,40,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-mono text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Join the next SEAL Hackathon
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-navy/75 sm:text-lg">
          Students: register your team and compete for prizes. Schools and partners: collaborate
          with FPT University HCMC to host future events on the SEAL platform.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <PixelButton href="/register" variant="secondary" className="h-12 px-8">
            Register Now
          </PixelButton>
          <PixelButton href="#featured" variant="secondary" className="h-12 px-8">
            Learn More
          </PixelButton>
        </div>
        <p className="mt-6 font-mono text-xs font-semibold text-navy/60">
          Registration closes {CTA_DEADLINE}
        </p>
      </div>
    </section>
  );
}
