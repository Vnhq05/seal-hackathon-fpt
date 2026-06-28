"use client";

import { PortalTopNav } from "@/shared/layouts/portal-topnav";

const BREADCRUMB_MAP: Record<string, { label: string; href: string }[]> = {
  "/coordinator": [{ label: "Dashboard", href: "/coordinator" }],
  "/coordinator/user-approval": [{ label: "User Approval", href: "/coordinator/user-approval" }],
  "/coordinator/participants": [{ label: "Participants", href: "/coordinator/participants" }],
  "/coordinator/assignments": [{ label: "Assignments", href: "/coordinator/assignments" }],
  "/coordinator/settings": [{ label: "Settings", href: "/coordinator/settings" }],
  "/coordinator/support": [{ label: "Support", href: "/coordinator/support" }],
};

export function CoordinatorTopNav() {
  return (
    <PortalTopNav
      breadcrumbMap={BREADCRUMB_MAP}
      defaultBreadcrumb={{ label: "Dashboard", href: "/coordinator" }}
      pathPrefix="/coordinator"
      searchPlaceholder="Search users, teams..."
    />
  );
}
