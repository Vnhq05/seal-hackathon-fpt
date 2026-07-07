"use client";

import Link from "next/link";

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s12 = { stroke: "currentColor", strokeWidth: 1.2 } as const;
const cap = { strokeLinecap: "round" as const };

function ApproveIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><circle cx="6" cy="5" r="3" {...s12} /><path d="M1 14c0-2.761 2.239-5 5-5" {...s12} {...cap} /><path d="M11 9l1.5 1.5L15 8" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}
function PlusCircleIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><circle cx="8" cy="8" r="7" stroke="#ffffff" strokeWidth="1.5" /><path d="M8 5v6M5 8h6" stroke="#ffffff" strokeWidth="1.5" {...cap} /></svg>;
}
function FeedbackIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><path d="M2 12V5a2 2 0 012-2h8a2 2 0 012 2v5a2 2 0 01-2 2H7l-3 2.5V12z" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}

const ACTIONS = [
  { label: "Approve Users", href: "/coordinator#pending-approvals", icon: <ApproveIcon /> },
  { label: "Judge assignments", href: "/coordinator/assignments", icon: <ApproveIcon /> },
  { label: "Feedback", href: "/coordinator/feedback", icon: <FeedbackIcon /> },
] as const;

export function StaffQuickActions() {
  return (
    <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6">
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e1528", marginBottom: 16 }}>Quick Actions</h3>
      <div className="flex flex-col gap-3">
        <Link
          href="/coordinator/hackathons/new"
          className="flex items-center gap-3 border-2 border-navy bg-seal-yellow px-4 py-2.5 text-[13px] text-navy font-mono font-bold"
        >
          <PlusCircleIcon />
          Create Hackathon
        </Link>
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 border-2 border-navy bg-white px-4 py-2.5 text-[13px] font-medium text-navy"
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
