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

function BellIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
      <path d="M12 7A4 4 0 004 7c0 4.5-2 6-2 6h12s-2-1.5-2-6M6.27 16a2 2 0 003.46 0" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
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
  "/lecturer": [{ label: "Dashboard", href: "/lecturer" }],
  "/lecturer/rounds": [{ label: "Rounds", href: "/lecturer/rounds" }],
  "/lecturer/settings": [{ label: "Settings", href: "/lecturer/settings" }],
  "/lecturer/support": [{ label: "Support", href: "/lecturer/support" }],
};

function getBreadcrumbs(pathname: string) {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  if (pathname.startsWith("/lecturer/rounds/")) {
    return [
      { label: "Rounds", href: "/lecturer/rounds" },
      { label: "Round Detail", href: pathname },
    ];
  }
  return [{ label: "Dashboard", href: "/lecturer" }];
}

export function LecturerTopNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const crumbs = getBreadcrumbs(pathname);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "L";

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

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-seal-border bg-seal-surface-elevated/50 px-3 py-2 transition-all duration-200 focus-within:border-violet-400/30 focus-within:ring-2 focus-within:ring-violet-400/10" style={{ width: 240 }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search teams, submissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-none bg-transparent text-[13px] font-medium text-seal-text outline-none placeholder:text-seal-text-muted"
          />
        </div>
        <button type="button" className="rounded-lg p-2 text-seal-text-muted transition-all duration-200 hover:bg-seal-surface-elevated hover:text-seal-text"><BellIcon /></button>
        <div className="ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-seal-border bg-gradient-to-br from-violet-400/10 to-purple-400/5 transition-all duration-200 hover:border-violet-400/30">
          <span className="text-[11px] font-bold text-violet-500">{initials}</span>
        </div>
      </div>
    </header>
  );
}
