"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { performLogout } from "@/features/auth/lib/logout";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { PixelLogo } from "@/shared/ui/seal-logo";
import { GridBackground } from "@/shared/ui/seal-logo";
import {
  isPortalNavActive,
  PortalNavLink,
  type PortalAccent,
} from "@/shared/layouts/portal-nav-link";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface PortalSidebarProps {
  homeHref: string;
  roleLabel: string;
  accent: PortalAccent;
  accentTextClass: string;
  navItems: PortalNavItem[];
  topCta?: { href: string; label: string };
  cta?: { href: string; label: string };
  supportHref?: string;
  settingsHref?: string;
}

function SupportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 6.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M9 13h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M7 15H4.5A1.5 1.5 0 013 13.5v-9A1.5 1.5 0 014.5 3H7M12 12.5L15 9l-3-3.5M15 9H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function PortalSidebar({
  homeHref,
  roleLabel,
  accent,
  accentTextClass,
  navItems,
  topCta,
  cta,
  supportHref,
  settingsHref,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await performLogout(router, queryClient);
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <aside className="relative flex w-60 min-h-screen flex-shrink-0 flex-col border-r-2 border-navy/20 bg-navy p-4">
      <GridBackground className="opacity-30" />

      <div className="relative pb-5">
        <Link href={homeHref}>
          <PixelLogo size="sm" variant="dark" />
        </Link>
        <p className={`mt-1 font-mono text-[10px] font-bold uppercase tracking-widest ${accentTextClass}`}>
          {roleLabel}
        </p>
      </div>

      <div className="relative mb-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {topCta ? (
        <div className="relative mb-5">
          <Link
            href={topCta.href}
            className="flex items-center justify-center gap-2 border-2 border-navy bg-seal-yellow px-4 py-2.5 font-mono text-xs font-bold uppercase text-navy shadow-[3px_3px_0_0_#0c1228]"
          >
            {topCta.label}
          </Link>
        </div>
      ) : null}

      <div className="relative mb-5">
        <div className="flex items-center gap-3 border-2 border-white/10 bg-white/5 p-2.5">
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center border-2 border-white/20 bg-white/10`}>
            <span className="font-mono text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-bold text-white">
              {user?.fullName ?? "User"}
            </p>
            <p className={`truncate font-mono text-[10px] uppercase tracking-wide ${accentTextClass}`}>
              {roleLabel}
            </p>
          </div>
        </div>
      </div>

      <nav className="relative flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Portal navigation">
        {navItems.map((item) => (
          <PortalNavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={isPortalNavActive(pathname, item.href)}
            accent={accent}
          />
        ))}
      </nav>

      <div className="relative flex flex-col gap-3 pt-4">
        {cta ? (
          <Link
            href={cta.href}
            className="flex items-center justify-center border-2 border-navy bg-seal-yellow px-4 py-2.5 font-mono text-xs font-bold uppercase text-navy shadow-[3px_3px_0_0_#0c1228] transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_#0c1228]"
          >
            {cta.label}
          </Link>
        ) : null}

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex flex-col gap-0.5">
          {supportHref ? (
            <Link
              href={supportHref}
              className="flex items-center gap-3 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
            >
              <SupportIcon />
              Support
            </Link>
          ) : null}
          {settingsHref ? (
            <Link
              href={settingsHref}
              className="flex items-center gap-3 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
            >
              <SettingsIcon />
              Settings
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-white/50 transition-colors hover:bg-seal-error/10 hover:text-seal-error"
          >
            <SignOutIcon />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
