import { LandingNavbar } from "./landing-navbar";
import { HeroSection } from "./hero-section";
import { StatsSection } from "./stats-section";
import { FeaturedEvent } from "./featured-event";
import { HackathonSeries } from "./hackathon-series";
import { PlatformFeatures } from "./platform-features";
import { RoleCards } from "./role-cards";
import { HowItWorks } from "./how-it-works";
import { ScoringCriteria } from "./scoring-criteria";
import { FaqSection } from "./faq-section";
import { CTASection } from "./cta-section";
import { Footer } from "./footer";

export function LandingPage() {
  return (
    <div className="min-h-full bg-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturedEvent />
        <HackathonSeries />
        <PlatformFeatures />
        <RoleCards />
        <HowItWorks />
        <ScoringCriteria />
        <FaqSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
