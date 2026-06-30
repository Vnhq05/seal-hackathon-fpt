"use client";

import { PortalTopNav } from "@/shared/layouts/portal-topnav";

const BREADCRUMB_MAP: Record<string, { label: string; href: string }[]> = {
  "/student": [{ label: "Dashboard", href: "/student" }],
  "/student/teams": [{ label: "Teams", href: "/student/teams" }],
  "/student/submissions": [{ label: "Submissions", href: "/student/submissions" }],
  "/student/results": [{ label: "Results & Awards", href: "/student/results" }],
  "/student/mentor-hub": [{ label: "MentorHub", href: "/student/mentor-hub" }],
  "/student/settings": [{ label: "Settings", href: "/student/settings" }],
};

const NAV_LINKS = [
  { href: "/student/projects", label: "Explore" },
  { href: "/ranking", label: "Rankings" },
  { href: "/student/results", label: "Results" },
  { href: "/student/teams", label: "Teams" },
];

export function DashboardTopNav() {
  return (
    <PortalTopNav
      breadcrumbMap={BREADCRUMB_MAP}
      defaultBreadcrumb={{ label: "Dashboard", href: "/student" }}
      pathPrefix="/student"
      navLinks={NAV_LINKS}
      searchPlaceholder="Search teams, events..."
    />
  );
}
