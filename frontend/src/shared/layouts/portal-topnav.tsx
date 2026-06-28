"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { SEAL_TOPNAV } from "@/shared/ui/seal-pixel";

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
      <path d="M1 1l2 2-2 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface PortalTopNavLink {
  href: string;
  label: string;
}

interface PortalTopNavProps {
  breadcrumbMap: Record<string, { label: string; href: string }[]>;
  defaultBreadcrumb: { label: string; href: string };
  pathPrefix: string;
  navLinks?: PortalTopNavLink[];
  searchPlaceholder?: string;
  resolveBreadcrumbs?: (pathname: string) => { label: string; href: string }[] | undefined;
}

export function PortalTopNav({
  breadcrumbMap,
  defaultBreadcrumb,
  pathPrefix,
  navLinks = [],
  searchPlaceholder = "Search...",
  resolveBreadcrumbs,
}: PortalTopNavProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");

  const crumbs =
    breadcrumbMap[pathname] ??
    resolveBreadcrumbs?.(pathname) ??
    (pathname.startsWith(pathPrefix) ? [defaultBreadcrumb] : [defaultBreadcrumb]);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className={`${SEAL_TOPNAV} sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-between px-6`}>
      <nav className="flex items-center gap-2" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-2">
              {i > 0 ? (
                <span className="text-seal-text-muted">
                  <ChevronRight />
                </span>
              ) : null}
              {isLast ? (
                <span className="font-mono text-xs font-bold uppercase text-navy">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="font-mono text-xs font-semibold uppercase text-seal-text-secondary transition-colors hover:text-navy"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

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
          <div className="ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center border-2 border-navy bg-seal-yellow">
            <span className="font-mono text-[11px] font-bold text-navy">{initials}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
