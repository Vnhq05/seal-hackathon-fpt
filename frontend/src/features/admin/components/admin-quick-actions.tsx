"use client";

import Link from "next/link";

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s12 = { stroke: "currentColor", strokeWidth: 1.2 } as const;
const cap = { strokeLinecap: "round" as const };

function PlusCircleIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><circle cx="8" cy="8" r="7" stroke="#ffffff" strokeWidth="1.5" /><path d="M8 5v6M5 8h6" stroke="#ffffff" strokeWidth="1.5" {...cap} /></svg>;
}
function UsersIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><circle cx="6" cy="5" r="2.5" {...s12} /><path d="M1 14c0-2.761 2.239-5 5-5s5 2.239 5 5" {...s12} {...cap} /><circle cx="12" cy="5" r="2" {...s12} /><path d="M15 14c0-1.657-1.343-3-3-3" {...s12} {...cap} /></svg>;
}
function GearIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" {...svgProps}><rect x="2" y="2" width="12" height="12" rx="2" {...s12} /><circle cx="8" cy="8" r="2" {...s12} /></svg>;
}

export function AdminQuickActions() {
  return (
    <div
      className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6 mb-4"
    >
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e1528", marginBottom: 16 }}>Quick Actions</h3>
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/hackathons/new"
          className="flex items-center gap-3 border-2 border-navy bg-seal-yellow px-4 py-2.5 text-[13px] text-navy font-mono font-bold"
        >
          <PlusCircleIcon />
          Create New Event
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center gap-3 border-2 border-navy bg-white px-4 py-2.5 text-[13px] font-medium text-navy"
        >
          <UsersIcon />
          Manage Users
        </Link>
        <Link
          href="/admin/system"
          className="flex items-center gap-3 border-2 border-navy bg-white px-4 py-2.5 text-[13px] font-medium text-navy"
        >
          <GearIcon />
          System Settings
        </Link>
      </div>
    </div>
  );
}
