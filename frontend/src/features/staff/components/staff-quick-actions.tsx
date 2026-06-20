"use client";

import Link from "next/link";

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s12 = { stroke: "#8891a5", strokeWidth: 1.2 } as const;
const cap = { strokeLinecap: "round" as const };

function ApproveIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><circle cx="6" cy="5" r="3" {...s12} /><path d="M1 14c0-2.761 2.239-5 5-5" {...s12} {...cap} /><path d="M11 9l1.5 1.5L15 8" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}
function RankingsIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><rect x="1" y="7" width="3.5" height="8" rx="0.5" {...s12} /><rect x="6.25" y="2" width="3.5" height="13" rx="0.5" {...s12} /><rect x="11.5" y="4.5" width="3.5" height="10.5" rx="0.5" {...s12} /></svg>;
}
function PublishIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><path d="M8 11V3M5 5.5L8 3l3 2.5M3 13h10" {...s12} {...cap} /></svg>;
}
function ExportIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><path d="M8 2v8M5 7l3 3 3-3M3 12h10" {...s12} {...cap} /></svg>;
}

const ACTIONS = [
  { label: "Approve Users", href: "/staff/user-approval", icon: <ApproveIcon /> },
  { label: "View Rankings", href: "/staff/rankings", icon: <RankingsIcon /> },
  { label: "Publish Results", href: "/staff/awards", icon: <PublishIcon /> },
  { label: "Export Report", href: "/staff/audit-log", icon: <ExportIcon /> },
] as const;

export function StaffQuickActions() {
  return (
    <div
      className="rounded-lg"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)", padding: 24 }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0e1528", marginBottom: 16 }}>
        Quick Actions
      </h3>
      <div className="flex flex-col gap-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-lg p-3 transition-colors"
            style={{ fontSize: 13, fontWeight: 500, color: "#0e1528", backgroundColor: "#eef0f6", border: "1px solid rgba(223,226,236,0.8)" }}
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>

      <div style={{ borderTop: "1px solid rgba(223,226,236,0.8)", marginTop: 20, paddingTop: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#8891a5", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>
          System Status
        </p>
        <div className="flex items-center gap-2">
          <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: "#22c55e" }} />
          <span style={{ fontSize: 13, color: "#0e1528" }}>All Systems Operational</span>
        </div>
      </div>
    </div>
  );
}
