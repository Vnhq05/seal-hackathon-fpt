import { GridBackground, PixelButton } from "./landing-ui";
import { PixelScene } from "./pixel-scene";

export function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden bg-white">
      <GridBackground />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20">
        <div className="max-w-xl">
          <h1 className="font-mono text-4xl font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-6xl">
            Build, Compete, and Innovate with SEAL
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-seal-text-secondary sm:text-lg">
            A modern hackathon management platform for FPT students, external students,
            lecturers, coordinators, and admins.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PixelButton href="#featured">Explore Hackathons</PixelButton>
            <PixelButton href="#cta" variant="secondary">
              Organize an Event
            </PixelButton>
          </div>
        </div>

        <div className="relative lg:pl-4">
          <PixelScene />
        </div>
      </div>
    </section>
  );
}
