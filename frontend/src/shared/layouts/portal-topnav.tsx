"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { resolveFileUrl } from "@/lib/files";
import { SEAL_TOPNAV } from "@/shared/ui/seal-pixel";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export interface PortalTopNavLink {
  href: string;
  label: string;
}

interface PortalTopNavProps {
  navLinks?: PortalTopNavLink[];
  searchPlaceholder?: string;
}

export function PortalTopNav({
  navLinks = [],
  searchPlaceholder = "Search...",
}: PortalTopNavProps) {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";
  const avatarSrc = resolveFileUrl(user?.avatarUrl);

  return (
    <header className={`${SEAL_TOPNAV} sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-end px-6`}>
      <div className="flex items-center gap-6">
        {navLinks.length > 0 ? (
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 font-mono text-xs font-semibold uppercase text-seal-text-secondary transition-colors hover:bg-seal-surface-sunken hover:text-navy"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="hidden w-60 items-center gap-2 border-2 border-navy/20 bg-white px-3 py-2 focus-within:border-royal/50 sm:flex">
            <span className="text-seal-text-muted">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-none bg-transparent font-mono text-xs text-seal-text outline-none placeholder:text-seal-text-muted"
            />
          </div>
          <div className="ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden border-2 border-navy bg-seal-yellow">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-mono text-[11px] font-bold text-navy">{initials}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
