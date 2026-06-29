"use client";

import { PortalSidebar } from "@/shared/layouts/portal-sidebar";

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s15 = { stroke: "currentColor", strokeWidth: 1.5 } as const;
const cap = { strokeLinecap: "round" as const };

const NAV_ITEMS = [
  {
    href: "/student",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}>
        <rect x="2" y="2" width="6" height="6" rx="1.5" {...s15} />
        <rect x="10" y="2" width="6" height="6" rx="1.5" {...s15} />
        <rect x="2" y="10" width="6" height="6" rx="1.5" {...s15} />
        <rect x="10" y="10" width="6" height="6" rx="1.5" {...s15} />
      </svg>
    ),
  },
  {
    href: "/student/teams",
    label: "Teams",
    icon: (
      <svg width="24" height="12" viewBox="0 0 24 12" {...svgProps}>
        <circle cx="8" cy="4" r="2.5" {...s15} />
        <path d="M2 12c0-2.761 2.239-5 5-5" {...s15} {...cap} />
        <circle cx="16" cy="4" r="2" {...s15} />
        <path d="M22 12c0-2.21-1.343-4-3-4" {...s15} {...cap} />
      </svg>
    ),
  },
  {
    href: "/student/tracks/draw",
    label: "Competition track",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}>
        <rect x="2" y="3" width="14" height="12" rx="1" {...s15} />
        <path d="M6 7h6M6 11h4" {...s15} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/student/submissions",
    label: "Submissions",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}>
        <path d="M10 2v10M6 8l4 4 4-4" {...s15} {...cap} />
        <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" {...s15} {...cap} />
      </svg>
    ),
  },
  {
    href: "/ranking",
    label: "Rankings",
    icon: (
      <svg width="20" height="18" viewBox="0 0 20 18" {...svgProps}>
        <rect x="2" y="8" width="4" height="10" rx="1" {...s15} />
        <rect x="8" y="2" width="4" height="16" rx="1" {...s15} />
        <rect x="14" y="5" width="4" height="13" rx="1" {...s15} />
      </svg>
    ),
  },
  {
    href: "/student/feedback",
    label: "Feedback",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}>
        <path d="M2 16V4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4z" {...s15} {...cap} strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/student/mentor-hub",
    label: "MentorHub",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}>
        <path d="M2 16V4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4z" {...s15} {...cap} strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/student/settings",
    label: "Settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}>
        <circle cx="10" cy="10" r="3" {...s15} />
        <path d="M10 1v2M10 17v2M1 10h2M17 10h2" {...s15} {...cap} />
      </svg>
    ),
  },
];

export function DashboardSidebar() {
  return (
    <PortalSidebar
      homeHref="/student"
      roleLabel="Student"
      accent="royal"
      accentTextClass="text-royal/60"
      navItems={NAV_ITEMS}
      cta={{ href: "/student/submissions", label: "Submit Project" }}
      supportHref="/student/support"
    />
  );
}
