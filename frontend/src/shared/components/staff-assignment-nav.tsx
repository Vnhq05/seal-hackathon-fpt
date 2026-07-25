"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStaffPortalBase } from "@/shared/hooks/use-staff-portal-base";

const TABS = [
  { segment: "assignments/overview", label: "Overview", exact: false },
  { segment: "assignments", label: "Judge assignments", exact: true },
  { segment: "assignments/teams", label: "Team assignments", exact: false },
  { segment: "assignments/mentors", label: "Mentor assignments", exact: false },
] as const;

export function StaffAssignmentNav() {
  const portalBase = useStaffPortalBase();
  const pathname = usePathname();

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b-2 border-navy/10 pb-3"
      aria-label="Assignment sections"
    >
      {TABS.map((tab) => {
        const href = `${portalBase}/${tab.segment}`;
        const active = tab.exact
          ? pathname === href
          : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`border-2 px-4 py-2 text-sm font-mono font-bold transition-colors ${
              active
                ? "border-navy bg-seal-yellow text-navy shadow-[3px_3px_0_0_#0c1228]"
                : "border-navy/30 bg-white text-seal-text-secondary hover:border-navy hover:text-navy"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
