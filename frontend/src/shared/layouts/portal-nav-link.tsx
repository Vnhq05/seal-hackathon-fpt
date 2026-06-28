"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type PortalAccent = "royal" | "success" | "blue" | "error" | "yellow";

const accentStyles: Record<
  PortalAccent,
  { activeText: string; activeIcon: string; border: string; label: string; divider: string }
> = {
  royal: {
    activeText: "text-royal-light",
    activeIcon: "text-royal-light",
    border: "border-l-seal-yellow",
    label: "text-royal/60",
    divider: "via-royal/20",
  },
  success: {
    activeText: "text-seal-success",
    activeIcon: "text-seal-success",
    border: "border-l-seal-yellow",
    label: "text-seal-success/60",
    divider: "via-seal-success/20",
  },
  blue: {
    activeText: "text-seal-blue-light",
    activeIcon: "text-seal-blue-light",
    border: "border-l-seal-yellow",
    label: "text-seal-blue/60",
    divider: "via-seal-blue/20",
  },
  error: {
    activeText: "text-seal-error",
    activeIcon: "text-seal-error",
    border: "border-l-seal-yellow",
    label: "text-seal-error/60",
    divider: "via-seal-error/20",
  },
  yellow: {
    activeText: "text-seal-yellow",
    activeIcon: "text-seal-yellow",
    border: "border-l-seal-yellow",
    label: "text-seal-yellow/60",
    divider: "via-seal-yellow/20",
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
  accent = "royal",
}: PortalNavLinkProps) {
  const styles = accentStyles[accent];

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 border-l-2 px-3 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${
        isActive
          ? `border-seal-yellow bg-white/5 ${styles.activeText}`
          : `border-transparent text-white/50 hover:bg-white/5 hover:text-white/80`
      }`}
    >
      <span className={isActive ? styles.activeIcon : "text-white/40"}>{icon}</span>
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
