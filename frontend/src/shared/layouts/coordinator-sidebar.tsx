"use client";

import { PortalSidebar } from "@/shared/layouts/portal-sidebar";

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s15 = { stroke: "currentColor", strokeWidth: 1.5 } as const;
const s12 = { stroke: "currentColor", strokeWidth: 1.2 } as const;
const cap = { strokeLinecap: "round" as const };

const NAV_ITEMS = [
  { href: "/coordinator", label: "Dashboard", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><rect x="2" y="2" width="6" height="6" rx="1.5" {...s15} /><rect x="10" y="2" width="6" height="6" rx="1.5" {...s15} /><rect x="2" y="10" width="6" height="6" rx="1.5" {...s15} /><rect x="10" y="10" width="6" height="6" rx="1.5" {...s15} /></svg> },
  { href: "/coordinator/hackathons", label: "Event Management", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M9 1l2.47 5.01L17 6.81l-4 3.9.94 5.49L9 13.61l-4.94 2.59L5 10.71l-4-3.9 5.53-.8L9 1z" {...s15} /></svg> },
  { href: "/coordinator/criteria", label: "Criteria", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M4 9l3 3 7-7" {...s15} {...cap} strokeLinejoin="round" /><rect x="1" y="1" width="16" height="16" rx="3" {...s15} /></svg> },
  { href: "/coordinator/platform-config", label: "Platform Config", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="9" cy="9" r="3" {...s15} /><path d="M9 1v2M9 15v2M1 9h2M15 9h2" {...s15} {...cap} /></svg> },
  { href: "/coordinator/assignments", label: "Assignments", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="7" cy="5" r="3" {...s12} /><path d="M1 16c0-3.314 2.686-6 6-6s6 2.686 6 6" {...s12} {...cap} /><path d="M14 8l2 2 2-2" {...s12} {...cap} strokeLinejoin="round" /></svg> },
  { href: "/coordinator/livescore", label: "LiveScore Arena", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M9 1L11 6H16L12 9.5L13.5 15L9 11.5L4.5 15L6 9.5L2 6H7L9 1Z" {...s15} /><circle cx="9" cy="9" r="7.5" {...s12} /></svg> },
  { href: "/coordinator/score-reviews", label: "Score Review", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M3 14l3-8 3 4 3-6 3 10" {...s15} {...cap} strokeLinejoin="round" /><line x1="3" y1="16" x2="15" y2="16" {...s15} {...cap} /></svg> },
  { href: "/coordinator/feedback", label: "Feedback", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M2 14V5a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7l-3 3z" {...s15} {...cap} strokeLinejoin="round" /></svg> },
];

export function CoordinatorSidebar() {
  return (
    <PortalSidebar
      homeHref="/coordinator"
      roleLabel="Coordinator"
      accent="blue"
      accentTextClass="text-seal-blue/60"
      navItems={NAV_ITEMS}
      topCta={{ href: "/coordinator/hackathons/new", label: "+ Create Hackathon" }}
      supportHref="/coordinator/support"
      settingsHref="/coordinator/settings"
    />
  );
}
