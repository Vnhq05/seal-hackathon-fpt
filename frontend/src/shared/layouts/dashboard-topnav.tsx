"use client";

import Link from "next/link";

const NAV_LINKS = [
  { href: "/participant/projects", label: "Explore" },
  { href: "/participant/leaderboard", label: "Leaderboard" },
  { href: "/participant/teams", label: "Teams" },
];

export function DashboardTopNav() {
  return (
    <header className="seal-topnav sticky top-0 z-30 flex-shrink-0">
      <div className="flex items-center justify-end gap-6 px-6 py-2.5">
        <nav className="mr-auto flex gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-seal-text-secondary transition-all duration-200 hover:bg-seal-cyan/5 hover:text-seal-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>

      </div>
    </header>
  );
}
