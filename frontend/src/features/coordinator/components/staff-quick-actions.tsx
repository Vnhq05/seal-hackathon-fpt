"use client";

import Link from "next/link";

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s12 = { stroke: "currentColor", strokeWidth: 1.2 } as const;
const cap = { strokeLinecap: "round" as const };

function ApproveIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><circle cx="6" cy="5" r="3" {...s12} /><path d="M1 14c0-2.761 2.239-5 5-5" {...s12} {...cap} /><path d="M11 9l1.5 1.5L15 8" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}
function ParticipantsIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><circle cx="6" cy="5" r="3" {...s12} /><path d="M1 14c0-2.761 2.239-5 5-5" {...s12} {...cap} /><circle cx="12" cy="5" r="2" {...s12} /></svg>;
}
function AssignmentIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><circle cx="6" cy="5" r="3" {...s12} /><path d="M1 14c0-2.761 2.239-5 5-5" {...s12} {...cap} /><path d="M11 9l1.5 1.5L15 8" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}
const ACTIONS = [
  { label: "Approve Users", href: "/coordinator/user-approval", icon: <ApproveIcon /> },
  { label: "View Participants", href: "/coordinator/participants", icon: <ParticipantsIcon /> },
  { label: "Judge Assignments", href: "/coordinator/assignments", icon: <AssignmentIcon /> },
] as const;

export function StaffQuickActions() {
  return (
    <div className="rounded-xl border border-seal-border/50 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-seal-text">Quick Actions</h3>
      <div className="flex flex-col gap-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-lg border border-seal-border/50 bg-seal-bg px-3 py-2.5 text-[13px] font-medium text-seal-text transition-colors hover:border-seal-purple/30 hover:bg-seal-purple/5"
          >
            <span className="text-seal-text-muted">{action.icon}</span>
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
