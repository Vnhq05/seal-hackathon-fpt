import { GridBackground, PixelButton } from "./landing-ui";

export function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden bg-white">
      <GridBackground />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center sm:px-6 md:py-20 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <h1 className="font-mono text-4xl font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-6xl">
            Build, Compete, and Innovate with SEAL
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-seal-text-secondary sm:text-lg">
            A modern hackathon management platform for FPT students, external students,
            lecturers, coordinators, and admins.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <PixelButton href="#featured">Explore Hackathons</PixelButton>
            <PixelButton href="#cta" variant="secondary">
              Organize an Event
            </PixelButton>
          </div>
        </div>
      </div>
    </section>
  );
}
