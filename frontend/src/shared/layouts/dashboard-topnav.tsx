"use client";

import { PortalTopNav } from "@/shared/layouts/portal-topnav";

const NAV_LINKS = [
  { href: "/student/projects", label: "Explore" },
  { href: "/ranking", label: "Rankings" },
  { href: "/student/results", label: "Results" },
  { href: "/student/teams", label: "Teams" },
];

export function DashboardTopNav() {
  return (
    <PortalTopNav
      navLinks={NAV_LINKS}
      searchPlaceholder="Search teams, events..."
    />
  );
}
