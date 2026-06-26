"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/features/auth/store/auth.store";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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
  "/student": [{ label: "Dashboard", href: "/student" }],
  "/student/teams": [{ label: "Teams", href: "/student/teams" }],
  "/student/submissions": [{ label: "Submissions", href: "/student/submissions" }],
  "/student/mentor-hub": [{ label: "MentorHub", href: "/student/mentor-hub" }],
  "/student/settings": [{ label: "Settings", href: "/student/settings" }],
};

function getBreadcrumbs(pathname: string) {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  if (pathname.startsWith("/student/")) {
    return [{ label: "Dashboard", href: "/student" }];
  }
  return [{ label: "Dashboard", href: "/student" }];
}

const NAV_LINKS = [
  { href: "/student/projects", label: "Explore" },
  { href: "/ranking", label: "Rankings" },
  { href: "/student/teams", label: "Teams" },
];

export function DashboardTopNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const crumbs = getBreadcrumbs(pathname);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="seal-topnav sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-between px-6">
      <nav className="flex items-center gap-2" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-2">
              {i > 0 && <span className="text-seal-text-muted"><ChevronRight /></span>}
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

      <div className="flex items-center gap-6">
        <nav className="hidden items-center gap-1 md:flex">
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

        <div className="flex items-center gap-3">
          <div className="hidden w-60 items-center gap-2 rounded-lg border border-seal-border bg-seal-surface-elevated/50 px-3 py-2 transition-all duration-200 focus-within:border-seal-cyan/30 focus-within:ring-2 focus-within:ring-seal-cyan/10 sm:flex">
            <span className="text-seal-text-muted"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search teams, events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-none bg-transparent text-[13px] font-medium text-seal-text outline-none placeholder:text-seal-text-muted"
            />
          </div>
          <div className="ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-seal-border bg-gradient-to-br from-seal-cyan/10 to-seal-blue/5">
            <span className="text-[11px] font-bold text-seal-cyan">{initials}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
