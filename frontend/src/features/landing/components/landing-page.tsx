import { Header } from "./header";
import { Hero } from "./hero";
import { Hackathons } from "./hackathons";
import { HowItWorks } from "./how-it-works";
import { Tracks } from "./tracks";
import { PlatformFeatures } from "./platform-features";
import { Stats } from "./stats";
import { CTA } from "./cta";
import { Footer } from "./footer";

export function LandingPage() {
  return (
    <div className="min-h-full bg-seal-bg">
      <Header />
      <main>
        <Hero />
        <Hackathons />
        <HowItWorks />
        <Tracks />
        <PlatformFeatures />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
