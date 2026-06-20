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
      className="rounded-lg"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 24, marginBottom: 16 }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e1528", marginBottom: 16 }}>Quick Actions</h3>
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/hackathons/new"
          className="flex items-center gap-3 rounded-lg"
          style={{ padding: "10px 16px", backgroundColor: "#38bdf8", color: "#ffffff", fontSize: 13, fontWeight: 600 }}
        >
          <PlusCircleIcon />
          Create New Event
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center gap-3 rounded-lg"
          style={{ padding: "10px 16px", backgroundColor: "#eef0f6", border: "1px solid rgba(223,226,236,0.8)", color: "#0e1528", fontSize: 13, fontWeight: 500 }}
        >
          <UsersIcon />
          Manage Users
        </Link>
        <Link
          href="/admin/system"
          className="flex items-center gap-3 rounded-lg"
          style={{ padding: "10px 16px", backgroundColor: "#eef0f6", border: "1px solid rgba(223,226,236,0.8)", color: "#0e1528", fontSize: 13, fontWeight: 500 }}
        >
          <GearIcon />
          System Settings
        </Link>
      </div>
    </div>
  );
}
