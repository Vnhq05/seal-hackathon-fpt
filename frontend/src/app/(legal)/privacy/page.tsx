import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — SEAL Hackathon",
};

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-seal-text">
        Privacy Policy
      </h1>
      <p className="mb-8 text-sm leading-relaxed text-seal-text-secondary">Last updated: June 2026</p>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold text-seal-text">1. Information We Collect</h2>
        <p className="text-sm leading-relaxed text-seal-text-secondary">
          We collect information you provide directly, including your name, email address,
          and profile information when you create an account or participate in hackathons.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold text-seal-text">2. How We Use Your Information</h2>
        <p className="text-sm leading-relaxed text-seal-text-secondary">
          We use collected information to provide and improve the platform, manage hackathon events,
          facilitate team formation, and communicate important updates to participants.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold text-seal-text">3. Data Sharing</h2>
        <p className="text-sm leading-relaxed text-seal-text-secondary">
          We do not sell your personal information. We may share data with hackathon organizers
          for event management purposes and with service providers who assist in platform operations.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold text-seal-text">4. Data Security</h2>
        <p className="text-sm leading-relaxed text-seal-text-secondary">
          We implement appropriate security measures to protect your personal information.
          However, no method of transmission over the Internet is 100% secure.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold text-seal-text">5. Contact</h2>
        <p className="text-sm leading-relaxed text-seal-text-secondary">
          For privacy-related inquiries, contact us at privacy@hacksync.dev.
        </p>
      </section>
    </article>
  );
}
