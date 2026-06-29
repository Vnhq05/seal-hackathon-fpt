"use client";

import { PortalSidebar } from "@/shared/layouts/portal-sidebar";

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s15 = { stroke: "currentColor", strokeWidth: 1.5 } as const;
const s12 = { stroke: "currentColor", strokeWidth: 1.2 } as const;
const cap = { strokeLinecap: "round" as const };

const NAV_ITEMS = [
  { href: "/coordinator", label: "Dashboard", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><rect x="2" y="2" width="6" height="6" rx="1.5" {...s15} /><rect x="10" y="2" width="6" height="6" rx="1.5" {...s15} /><rect x="2" y="10" width="6" height="6" rx="1.5" {...s15} /><rect x="10" y="10" width="6" height="6" rx="1.5" {...s15} /></svg> },
  { href: "/coordinator/user-approval", label: "User Approval", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="9" cy="6" r="3.5" {...s15} /><path d="M3 17c0-3.314 2.686-6 6-6s6 2.686 6 6" {...s15} {...cap} /><path d="M13 3l1.5 1.5L17 2" {...s12} {...cap} strokeLinejoin="round" /></svg> },
  { href: "/coordinator/enrollments", label: "Enrollments", icon: <svg width="20" height="16" viewBox="0 0 20 16" {...svgProps}><circle cx="7" cy="5" r="3" {...s15} /><path d="M1 15c0-3.314 2.686-6 6-6s6 2.686 6 6" {...s15} {...cap} /><circle cx="15" cy="5" r="2" {...s15} /><path d="M19 15c0-2.21-1.79-4-4-4" {...s15} {...cap} /></svg> },
  { href: "/coordinator/allowed-domains", label: "Email Domains", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><rect x="2" y="4" width="14" height="10" rx="1" {...s15} /><path d="M2 5l7 5 7-5" {...s12} {...cap} strokeLinejoin="round" /></svg> },
  { href: "/coordinator/participants", label: "Participants", icon: <svg width="20" height="16" viewBox="0 0 20 16" {...svgProps}><circle cx="7" cy="5" r="3" {...s15} /><path d="M1 15c0-3.314 2.686-6 6-6s6 2.686 6 6" {...s15} {...cap} /><circle cx="15" cy="5" r="2" {...s15} /><path d="M19 15c0-2.21-1.79-4-4-4" {...s15} {...cap} /></svg> },
  { href: "/coordinator/tracks", label: "Track Draw", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><rect x="2" y="3" width="14" height="12" rx="1" {...s15} /><path d="M6 7h6M6 11h4" {...s12} {...cap} /></svg> },
  { href: "/coordinator/assignments", label: "Team Judges", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="7" cy="5" r="3" {...s12} /><path d="M1 16c0-3.314 2.686-6 6-6s6 2.686 6 6" {...s12} {...cap} /><path d="M14 8l2 2 2-2" {...s12} {...cap} strokeLinejoin="round" /></svg> },
  { href: "/coordinator/assignments/judges", label: "Judge Pool", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="7" cy="5" r="3" {...s12} /><path d="M1 16c0-3.314 2.686-6 6-6s6 2.686 6 6" {...s12} {...cap} /><path d="M13 3l1.5 1.5L17 2" {...s12} {...cap} strokeLinejoin="round" /></svg> },
  { href: "/coordinator/assignments/mentors", label: "Mentor Pool", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="7" cy="5" r="3" {...s12} /><path d="M1 16c0-3.314 2.686-6 6-6s6 2.686 6 6" {...s12} {...cap} /><path d="M14 6v6M11 9h6" {...s12} {...cap} /></svg> },
  { href: "/coordinator/livescore", label: "Live Score", icon: <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><rect x="2" y="2" width="6" height="6" rx="1.5" {...s15} /><rect x="10" y="2" width="6" height="6" rx="1.5" {...s15} /><rect x="2" y="10" width="6" height="6" rx="1.5" {...s15} /><rect x="10" y="10" width="6" height="6" rx="1.5" {...s15} /></svg> },
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
      supportHref="/coordinator/support"
      settingsHref="/coordinator/settings"
    />
  );
}
