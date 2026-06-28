"use client";

import { PortalTopNav } from "@/shared/layouts/portal-topnav";

const BREADCRUMB_MAP: Record<string, { label: string; href: string }[]> = {
  "/lecturer": [{ label: "Dashboard", href: "/lecturer" }],
  "/lecturer/rounds": [{ label: "Rounds", href: "/lecturer/rounds" }],
  "/lecturer/settings": [{ label: "Settings", href: "/lecturer/settings" }],
  "/lecturer/support": [{ label: "Support", href: "/lecturer/support" }],
};

function resolveBreadcrumbs(pathname: string) {
  if (pathname.startsWith("/lecturer/rounds/")) {
    return [
      { label: "Rounds", href: "/lecturer/rounds" },
      { label: "Round Detail", href: pathname },
    ];
  }
  return undefined;
}

export function LecturerTopNav() {
  return (
    <PortalTopNav
      breadcrumbMap={BREADCRUMB_MAP}
      defaultBreadcrumb={{ label: "Dashboard", href: "/lecturer" }}
      pathPrefix="/lecturer"
      resolveBreadcrumbs={resolveBreadcrumbs}
      searchPlaceholder="Search teams, submissions..."
    />
  );
}
