"use client";

import { PortalTopNav } from "@/shared/layouts/portal-topnav";

const BREADCRUMB_MAP: Record<string, { label: string; href: string }[]> = {
  "/coordinator": [{ label: "Dashboard", href: "/coordinator" }],
  "/coordinator/user-approval": [{ label: "User Approval", href: "/coordinator/user-approval" }],
  "/coordinator/enrollments": [{ label: "Enrollments", href: "/coordinator/enrollments" }],
  "/coordinator/allowed-domains": [{ label: "Email Domains", href: "/coordinator/allowed-domains" }],
  "/coordinator/participants": [{ label: "Participants", href: "/coordinator/participants" }],
  "/coordinator/assignments": [{ label: "Assignments", href: "/coordinator/assignments" }],
  "/coordinator/assignments/judges": [
    { label: "Assignments", href: "/coordinator/assignments" },
    { label: "Judge Pool", href: "/coordinator/assignments/judges" },
  ],
  "/coordinator/assignments/mentors": [
    { label: "Assignments", href: "/coordinator/assignments" },
    { label: "Mentor Pool", href: "/coordinator/assignments/mentors" },
  ],
  "/coordinator/score-reviews": [{ label: "Score Review", href: "/coordinator/score-reviews" }],
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
