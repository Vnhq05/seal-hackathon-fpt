import Image from "next/image";
import Link from "next/link";

const EXPLORE_LINKS = [
  { label: "Featured Missions", href: "#featured" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Tracks", href: "#tracks" },
  { label: "Platform", href: "#platform" },
];

const PARTICIPANT_LINKS = [
  { label: "Register", href: "/register" },
  { label: "Find a Team", href: "#" },
  { label: "Submit a Project", href: "#" },
  { label: "FAQ", href: "#" },
];

const ORGANIZER_LINKS = [
  { label: "Create an Event", href: "#" },
  { label: "Organizer Guide", href: "#" },
  { label: "Mentor Resources", href: "#" },
  { label: "Judging Criteria", href: "#" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-seal-cyan/10 bg-seal-dark">
      {/* Background effects */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(14,165,233,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -top-32 -left-32 h-64 w-64 rounded-full bg-seal-cyan/5 blur-[100px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-seal-blue/5 blur-[100px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-seal-cyan/15 to-seal-blue/10 ring-1 ring-white/10">
                <Image src="/logo-removebg-preview.png" alt="SEAL Hackathon" width={28} height={28} className="brightness-0 invert" />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-white">
                SEAL <span className="text-seal-cyan">Hackathon</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              The all-in-one platform for discovering, joining, organizing, and managing
              hackathon competitions.
            </p>
            <div className="mt-6 flex gap-3">
              <span className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] font-medium tracking-wider text-slate-500">
                SEAL PLATFORM v3.0
              </span>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Explore
            </h4>
            <ul className="mt-4 space-y-3">
              {EXPLORE_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-slate-400 transition-colors hover:text-seal-cyan"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Participants */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Participants
            </h4>
            <ul className="mt-4 space-y-3">
              {PARTICIPANT_LINKS.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("/") ? (
                    <Link
                      href={l.href}
                      className="text-sm text-slate-400 transition-colors hover:text-seal-cyan"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <span className="cursor-default text-sm text-slate-600">
                      {l.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Organizers */}
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Organizers
            </h4>
            <ul className="mt-4 space-y-3">
              {ORGANIZER_LINKS.map((l) => (
                <li key={l.label}>
                  <span className="cursor-default text-sm text-slate-600">
                    {l.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} SEAL Hackathon. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-xs text-slate-500 transition-colors hover:text-seal-cyan"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-slate-500 transition-colors hover:text-seal-cyan"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
