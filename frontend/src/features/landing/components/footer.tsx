import Link from "next/link";
import { SealLogoMark } from "./landing-ui";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Events", href: "#featured" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Roles", href: "#roles" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

const CONTACT_LINKS = [
  { label: "Email", href: "mailto:seal@fpt.edu.vn" },
  { label: "Facebook", href: "https://facebook.com" },
  { label: "GitHub", href: "https://github.com" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t-2 border-navy/10 bg-navy">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <SealLogoMark size={36} variant="dark" />
              <span className="font-mono text-lg font-bold tracking-tight text-white">
                SEAL <span className="text-seal-yellow">Hackathon</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              A modern hackathon management platform for FPT University HCMC. Discover events,
              form teams, compete across tracks, and get recognized from registration through
              finals.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/50 transition-colors hover:text-seal-yellow"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Contact
            </h4>
            <ul className="mt-4 space-y-2.5">
              {CONTACT_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-sm text-white/50 transition-colors hover:text-seal-yellow"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/register"
                  className="text-sm text-white/50 transition-colors hover:text-seal-yellow"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-white/50 transition-colors hover:text-seal-yellow"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="font-mono text-xs text-white/40">
            &copy; {new Date().getFullYear()} FPT University HCMC. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="font-mono text-xs text-white/40 transition-colors hover:text-seal-yellow"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="font-mono text-xs text-white/40 transition-colors hover:text-seal-yellow"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
