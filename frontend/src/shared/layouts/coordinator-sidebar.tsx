"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { performLogout } from "@/features/auth/lib/logout";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { isPortalNavActive, PortalNavLink } from "@/shared/layouts/portal-nav-link";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s15 = { stroke: "currentColor", strokeWidth: 1.5 } as const;
const s12 = { stroke: "currentColor", strokeWidth: 1.2 } as const;
const cap = { strokeLinecap: "round" as const };

function DashboardIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><rect x="2" y="2" width="6" height="6" rx="1.5" {...s15} /><rect x="10" y="2" width="6" height="6" rx="1.5" {...s15} /><rect x="2" y="10" width="6" height="6" rx="1.5" {...s15} /><rect x="10" y="10" width="6" height="6" rx="1.5" {...s15} /></svg>;
}
function UserApprovalIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="9" cy="6" r="3.5" {...s15} /><path d="M3 17c0-3.314 2.686-6 6-6s6 2.686 6 6" {...s15} {...cap} /><path d="M13 3l1.5 1.5L17 2" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}
function ParticipantsIcon() {
  return <svg width="20" height="16" viewBox="0 0 20 16" {...svgProps}><circle cx="7" cy="5" r="3" {...s15} /><path d="M1 15c0-3.314 2.686-6 6-6s6 2.686 6 6" {...s15} {...cap} /><circle cx="15" cy="5" r="2" {...s15} /><path d="M19 15c0-2.21-1.79-4-4-4" {...s15} {...cap} /></svg>;
}
function AssignmentIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="7" cy="5" r="3" {...s12} /><path d="M1 16c0-3.314 2.686-6 6-6s6 2.686 6 6" {...s12} {...cap} /><path d="M14 8l2 2 2-2" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}
function SettingsIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}><circle cx="10" cy="10" r="3" {...s15} /><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" {...s15} {...cap} /></svg>;
}
function LogoutIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M7 15H4.5A1.5 1.5 0 013 13.5v-9A1.5 1.5 0 014.5 3H7M12 12.5L15 9l-3-3.5M15 9H7" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/coordinator", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/coordinator/user-approval", label: "User Approval", icon: <UserApprovalIcon /> },
  { href: "/coordinator/enrollments", label: "Enrollments", icon: <ParticipantsIcon /> },
  { href: "/coordinator/participants", label: "Participants", icon: <ParticipantsIcon /> },
  { href: "/coordinator/assignments", label: "Assignments", icon: <AssignmentIcon /> },
  { href: "/coordinator/livescore", label: "Live Score", icon: <DashboardIcon /> },
];

export function CoordinatorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await performLogout(router, queryClient);
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "C";

  return (
    <aside className="seal-sidebar-bg flex w-60 min-h-screen flex-shrink-0 flex-col p-4">
      <div className="pb-5">
        <Link href="/coordinator" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-seal-blue/20 to-seal-cyan/10 ring-1 ring-white/10">
            <Image src="/logo-removebg-preview.png" alt="SEAL" width={28} height={28} className="brightness-0 invert" />
          </div>
          <div>
            <span className="font-heading text-[15px] font-extrabold tracking-tight text-white">
              SEAL <span className="text-seal-blue-light">Hackathon</span>
            </span>
            <p className="text-[10px] font-medium tracking-widest text-seal-blue/50">COORDINATOR PORTAL</p>
          </div>
        </Link>
      </div>

      <div className="mb-5 h-px bg-gradient-to-r from-transparent via-seal-blue/20 to-transparent" />

      <div className="mb-5">
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 backdrop-blur-sm">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-seal-blue/30 to-seal-cyan/20 ring-1 ring-seal-blue/20">
            <span className="text-xs font-bold tracking-wider text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">{user?.fullName ?? "Coordinator"}</p>
            <p className="truncate text-[11px] font-medium text-seal-blue-light/70">Event Coordinator</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Coordinator navigation">
        {NAV_ITEMS.map((item) => (
          <PortalNavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={isPortalNavActive(pathname, item.href)}
            accent="blue"
          />
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 pt-2">
        <div className="mb-2 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <Link
          href="/coordinator/support"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium tracking-wide text-slate-500 transition-colors duration-200 hover:bg-white/[0.04] hover:text-slate-300"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.2" /><path d="M6.5 6.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M9 13h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          Support
        </Link>
        <Link
          href="/coordinator/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium tracking-wide text-slate-500 transition-colors duration-200 hover:bg-white/[0.04] hover:text-slate-300"
        >
          <SettingsIcon />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-none bg-transparent px-3 py-2 text-[13px] font-medium tracking-wide text-slate-500 transition-colors duration-200 hover:bg-seal-error/10 hover:text-seal-error"
        >
          <LogoutIcon />
          Logout
        </button>
      </div>
    </aside>
  );
}
