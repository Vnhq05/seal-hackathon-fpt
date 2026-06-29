"use client";

import { PortalTopNav } from "@/shared/layouts/portal-topnav";

const BREADCRUMB_MAP: Record<string, { label: string; href: string }[]> = {
  "/admin": [{ label: "Dashboard", href: "/admin" }],
  "/admin/hackathons": [{ label: "Hackathons", href: "/admin/hackathons" }],
  "/admin/hackathons/new": [
    { label: "Hackathons", href: "/admin/hackathons" },
    { label: "New Hackathon", href: "/admin/hackathons/new" },
  ],
  "/admin/rounds": [{ label: "Rounds", href: "/admin/rounds" }],
  "/admin/rounds/new": [
    { label: "Rounds", href: "/admin/rounds" },
    { label: "New Round", href: "/admin/rounds/new" },
  ],
  "/admin/criteria": [{ label: "Criteria", href: "/admin/criteria" }],
  "/admin/criteria/event": [
    { label: "Criteria", href: "/admin/criteria" },
    { label: "Event Criteria", href: "/admin/criteria/event" },
  ],
  "/admin/assignments": [{ label: "Assignments", href: "/admin/assignments" }],
  "/admin/assignments/judges": [
    { label: "Assignments", href: "/admin/assignments" },
    { label: "Judges", href: "/admin/assignments/judges" },
  ],
  "/admin/assignments/mentors": [
    { label: "Assignments", href: "/admin/assignments" },
    { label: "Mentors", href: "/admin/assignments/mentors" },
  ],
  "/admin/users": [{ label: "Users", href: "/admin/users" }],
  "/admin/system": [{ label: "System Config", href: "/admin/system" }],
  "/admin/analytics/variance": [{ label: "Score Review", href: "/admin/analytics/variance" }],
  "/admin/export": [{ label: "Export", href: "/admin/export" }],
  "/admin/settings": [{ label: "Settings", href: "/admin/settings" }],
  "/admin/support": [{ label: "Support", href: "/admin/support" }],
};

function resolveBreadcrumbs(pathname: string) {
  if (pathname.startsWith("/admin/hackathons/")) {
    return [
      { label: "Hackathons", href: "/admin/hackathons" },
      { label: "Edit Hackathon", href: pathname },
    ];
  }
  if (pathname.startsWith("/admin/rounds/")) {
    return [
      { label: "Rounds", href: "/admin/rounds" },
      { label: "Edit Round", href: pathname },
    ];
  }
  return undefined;
}

export function AdminTopNav() {
  return (
    <PortalTopNav
      breadcrumbMap={BREADCRUMB_MAP}
      defaultBreadcrumb={{ label: "Dashboard", href: "/admin" }}
      pathPrefix="/admin"
      resolveBreadcrumbs={resolveBreadcrumbs}
      searchPlaceholder="Search hackathons, users..."
    />
  );
}
