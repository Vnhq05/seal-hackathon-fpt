import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — SEAL Hackathon",
};

export default function TermsPage() {
  return (
    <article>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-seal-text">
        Terms of Service
      </h1>
      <p className="mb-8 text-sm leading-relaxed text-seal-text-secondary">Last updated: June 2026</p>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold text-seal-text">1. Acceptance of Terms</h2>
        <p className="text-sm leading-relaxed text-seal-text-secondary">
          By accessing and using SEAL Hackathon, you agree to be bound by these Terms of Service.
          If you do not agree with any part of these terms, you may not use the platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold text-seal-text">2. Use of the Platform</h2>
        <p className="text-sm leading-relaxed text-seal-text-secondary">
          SEAL Hackathon provides a platform for organizing and participating in hackathon events.
          You agree to use the platform only for lawful purposes and in accordance with these terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold text-seal-text">3. User Accounts</h2>
        <p className="text-sm leading-relaxed text-seal-text-secondary">
          You are responsible for maintaining the confidentiality of your account credentials.
          You must immediately notify us of any unauthorized use of your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold text-seal-text">4. Intellectual Property</h2>
        <p className="text-sm leading-relaxed text-seal-text-secondary">
          Projects submitted during hackathons remain the intellectual property of their creators
          unless otherwise specified by the hackathon organizer.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold text-seal-text">5. Contact</h2>
        <p className="text-sm leading-relaxed text-seal-text-secondary">
          For questions about these terms, contact us at support@hacksync.dev.
        </p>
      </section>
    </article>
  );
}
