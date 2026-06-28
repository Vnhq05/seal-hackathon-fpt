"use client";

import { PortalSidebar } from "@/shared/layouts/portal-sidebar";

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s15 = { stroke: "currentColor", strokeWidth: 1.5 } as const;
const s12 = { stroke: "currentColor", strokeWidth: 1.2 } as const;
const cap = { strokeLinecap: "round" as const };

const NAV_ITEMS = [
  { href: "/lecturer", label: "Dashboard", icon: <svg width="14" height="14" viewBox="0 0 14 14" {...svgProps}><rect x="1" y="1" width="5" height="5" rx="1" {...s15} /><rect x="8" y="1" width="5" height="5" rx="1" {...s15} /><rect x="1" y="8" width="5" height="5" rx="1" {...s15} /><rect x="8" y="8" width="5" height="5" rx="1" {...s15} /></svg> },
  { href: "/lecturer/rounds", label: "Assigned Rounds", icon: <svg width="16" height="17" viewBox="0 0 16 17" {...svgProps}><circle cx="8" cy="9" r="6.5" {...s12} /><path d="M8 5.5v3.5l2.5 1.5" {...s12} {...cap} /></svg> },
  { href: "/lecturer/scoring", label: "Submissions to Score", icon: <svg width="15" height="15" viewBox="0 0 15 15" {...svgProps}><rect x="2" y="1" width="11" height="13" rx="2" {...s12} /><path d="M5 4.5h5M5 7.5h5M5 10.5h3" stroke="currentColor" strokeWidth="1" {...cap} /></svg> },
  { href: "/lecturer/history", label: "Score History", icon: <svg width="14" height="14" viewBox="0 0 14 14" {...svgProps}><path d="M1 3v4h4" {...s12} {...cap} strokeLinejoin="round" /><path d="M3 10A6 6 0 112 6" {...s12} {...cap} /></svg> },
  { href: "/lecturer/teams", label: "My Teams", icon: <svg width="24" height="12" viewBox="0 0 24 12" {...svgProps}><circle cx="8" cy="4" r="2.5" {...s15} /><path d="M2 12c0-2.761 2.239-5 5-5" {...s15} {...cap} /><circle cx="16" cy="4" r="2" {...s15} /><path d="M22 12c0-2.21-1.343-4-3-4" {...s15} {...cap} /></svg> },
  { href: "/lecturer/mentor-hub", label: "MentorHub", icon: <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}><path d="M2 16V4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4z" {...s15} {...cap} strokeLinejoin="round" /></svg> },
  { href: "/lecturer/notifications", label: "Notifications", icon: <svg width="12" height="15" viewBox="0 0 12 15" {...svgProps}><path d="M9 5.5a3 3 0 00-6 0c0 3.5-1.5 4.5-1.5 4.5h9S9 9 9 5.5M4.5 12a1.5 1.5 0 003 0" {...s12} {...cap} /></svg> },
];

export function LecturerSidebar() {
  return (
    <PortalSidebar
      homeHref="/lecturer"
      roleLabel="Lecturer"
      accent="success"
      accentTextClass="text-seal-success/60"
      navItems={NAV_ITEMS}
      supportHref="/lecturer/support"
      settingsHref="/lecturer/settings"
    />
  );
}
