"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/features/auth/store/auth.store";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
      <path d="M12 12L16 16" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" stroke="#94a3b8" strokeWidth="1.2" />
      <path d="M7.5 7.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M10 14h.01" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 1a8 8 0 100 16 6 6 0 010-16z" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="4" height="6" viewBox="0 0 4 6" fill="none" aria-hidden="true">
      <path d="M1 1l2 2-2 2" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const BREADCRUMB_MAP: Record<string, { label: string; href: string }[]> = {
  "/admin": [{ label: "Dashboard", href: "/admin" }],
  "/admin/hackathons": [{ label: "Hackathons", href: "/admin/hackathons" }],
  "/admin/hackathons/new": [
    { label: "Hackathons", href: "/admin/hackathons" },
    { label: "New Hackathon", href: "/admin/hackathons/new" },
  ],
  "/admin/rounds": [{ label: "Rounds", href: "/admin/rounds" }],
  "/admin/rounds/new": [
    { label: "Rounds", href: "/admin/rounds" },
    { label: "New Round", href: "/admin/rounds/new" },
  ],
  "/admin/tracks": [{ label: "Tracks", href: "/admin/tracks" }],
  "/admin/tracks/new": [
    { label: "Tracks", href: "/admin/tracks" },
    { label: "New Track", href: "/admin/tracks/new" },
  ],
  "/admin/criteria": [{ label: "Criteria", href: "/admin/criteria" }],
  "/admin/criteria/event": [
    { label: "Criteria", href: "/admin/criteria" },
    { label: "Event Criteria", href: "/admin/criteria/event" },
  ],
  "/admin/assignments": [{ label: "Assignments", href: "/admin/assignments" }],
  "/admin/assignments/judges": [
    { label: "Assignments", href: "/admin/assignments" },
    { label: "Judges", href: "/admin/assignments/judges" },
  ],
  "/admin/assignments/mentors": [
    { label: "Assignments", href: "/admin/assignments" },
    { label: "Mentors", href: "/admin/assignments/mentors" },
  ],
  "/admin/assignments/staff": [
    { label: "Assignments", href: "/admin/assignments" },
    { label: "Staff", href: "/admin/assignments/staff" },
  ],
  "/admin/users": [{ label: "Users", href: "/admin/users" }],
  "/admin/system": [{ label: "System Config", href: "/admin/system" }],
  "/admin/analytics": [{ label: "Analytics", href: "/admin/analytics" }],
  "/admin/analytics/variance": [
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Judge Variance", href: "/admin/analytics/variance" },
  ],
  "/admin/analytics/calibration": [
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Calibration", href: "/admin/analytics/calibration" },
  ],
  "/admin/analytics/research": [
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Research Export", href: "/admin/analytics/research" },
  ],
  "/admin/export": [{ label: "Export", href: "/admin/export" }],
  "/admin/settings": [{ label: "Settings", href: "/admin/settings" }],
  "/admin/support": [{ label: "Support", href: "/admin/support" }],
};

function getBreadcrumbs(pathname: string) {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  if (pathname.startsWith("/admin/hackathons/")) {
    return [
      { label: "Hackathons", href: "/admin/hackathons" },
      { label: "Edit Hackathon", href: pathname },
    ];
  }
  if (pathname.startsWith("/admin/rounds/")) {
    return [
      { label: "Rounds", href: "/admin/rounds" },
      { label: "Edit Round", href: pathname },
    ];
  }
  if (pathname.startsWith("/admin/tracks/")) {
    return [
      { label: "Tracks", href: "/admin/tracks" },
      { label: "Edit Track", href: pathname },
    ];
  }
  return [{ label: "Dashboard", href: "/admin" }];
}

export function AdminTopNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const crumbs = getBreadcrumbs(pathname);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";

  return (
    <header className="seal-topnav sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-between px-6">
      <nav className="flex items-center gap-2" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-2">
              {i > 0 && <ChevronRight />}
              {isLast ? (
                <span className="text-[13px] font-bold text-seal-text">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="text-[13px] font-medium text-seal-text-secondary transition-colors hover:text-seal-text">
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-seal-border bg-seal-surface-elevated/50 px-3 py-2 transition-all duration-200 focus-within:border-seal-cyan/30 focus-within:ring-2 focus-within:ring-seal-cyan/10" style={{ width: 240 }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search hackathons, users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-none bg-transparent text-[13px] font-medium text-seal-text outline-none placeholder:text-seal-text-muted"
          />
        </div>
        <button type="button" className="rounded-lg p-2 text-seal-text-muted transition-all duration-200 hover:bg-seal-surface-elevated hover:text-seal-text"><HelpIcon /></button>
        <button type="button" className="rounded-lg p-2 text-seal-text-muted transition-all duration-200 hover:bg-seal-surface-elevated hover:text-seal-text"><ThemeIcon /></button>
        <div className="ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-seal-border bg-gradient-to-br from-seal-cyan/10 to-seal-blue/5 transition-all duration-200 hover:border-seal-cyan/30">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[11px] font-bold text-seal-cyan">{initials}</span>
          )}
        </div>
      </div>
    </header>
  );
}
