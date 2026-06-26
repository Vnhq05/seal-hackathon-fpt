"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type PortalAccent = "cyan" | "purple" | "violet" | "blue";

const accentStyles: Record<
  PortalAccent,
  { activeText: string; activeIcon: string; ring: string }
> = {
  cyan: {
    activeText: "text-seal-cyan",
    activeIcon: "text-seal-cyan",
    ring: "shadow-[inset_3px_0_0_0] shadow-seal-cyan/80",
  },
  purple: {
    activeText: "text-seal-purple-light",
    activeIcon: "text-seal-purple-light",
    ring: "shadow-[inset_3px_0_0_0] shadow-seal-purple-light/80",
  },
  violet: {
    activeText: "text-violet-400",
    activeIcon: "text-violet-400",
    ring: "shadow-[inset_3px_0_0_0] shadow-violet-400/80",
  },
  blue: {
    activeText: "text-seal-blue-light",
    activeIcon: "text-seal-blue-light",
    ring: "shadow-[inset_3px_0_0_0] shadow-seal-blue-light/80",
  },
};

interface PortalNavLinkProps {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  accent?: PortalAccent;
}

export function PortalNavLink({
  href,
  label,
  icon,
  isActive,
  accent = "cyan",
}: PortalNavLinkProps) {
  const styles = accentStyles[accent];

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-200 ${
        isActive
          ? `seal-sidebar-item-active bg-white/[0.08] ${styles.activeText} ${styles.ring}`
          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
      }`}
    >
      <span className={isActive ? styles.activeIcon : "text-slate-500"}>{icon}</span>
      {label}
    </Link>
  );
}

export function isPortalNavActive(pathname: string, href: string): boolean {
  if (href === "/student" || href === "/admin" || href === "/lecturer" || href === "/coordinator") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
