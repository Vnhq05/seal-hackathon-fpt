"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth.store";

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
function TeamsIcon() {
  return <svg width="20" height="18" viewBox="0 0 20 18" {...svgProps}><circle cx="7" cy="5" r="3" {...s15} /><circle cx="15" cy="5" r="2.5" {...s15} /><path d="M1 17c0-3.314 2.686-6 6-6 1.5 0 2.886.55 3.944 1.462M13 11.5c2.21 0 4 1.79 4 4" {...s15} {...cap} /></svg>;
}
function SubmissionsIcon() {
  return <svg width="18" height="20" viewBox="0 0 18 20" {...svgProps}><rect x="2" y="1" width="14" height="18" rx="2" {...s15} /><path d="M6 6h6M6 10h6M6 14h3" {...s12} {...cap} /></svg>;
}
function AwardsIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M5 1h8v5a4 4 0 01-8 0V1z" {...s15} /><path d="M5 3H2a1 1 0 00-1 1v1a3 3 0 003 3M13 3h3a1 1 0 011 1v1a3 3 0 01-3 3M9 10v3M6 15h6" {...s15} {...cap} /></svg>;
}
function RankingsIcon() {
  return <svg width="20" height="18" viewBox="0 0 20 18" {...svgProps}><rect x="2" y="8" width="4" height="10" rx="1" {...s15} /><rect x="8" y="2" width="4" height="16" rx="1" {...s15} /><rect x="14" y="5" width="4" height="13" rx="1" {...s15} /></svg>;
}
function AnnouncementsIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}><path d="M15 8a7 7 0 01-7 7H4l1.5-1.5A5.5 5.5 0 014 8.5V8a6 6 0 016-6h0a6 6 0 016 6v0z" {...s12} {...cap} strokeLinejoin="round" /><path d="M8 15v1a2 2 0 004 0v-1" {...s12} {...cap} /></svg>;
}
function DisqualifyIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="9" cy="9" r="7" {...s15} /><path d="M6 6l6 6M12 6l-6 6" {...s12} {...cap} /></svg>;
}
function PromotionsIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M9 14V4M5 8l4-4 4 4" {...s15} {...cap} /><path d="M3 16h12" {...s12} {...cap} /></svg>;
}
function AuditLogIcon() {
  return <svg width="18" height="20" viewBox="0 0 18 20" {...svgProps}><rect x="2" y="1" width="14" height="18" rx="2" {...s15} /><path d="M6 5h6M6 9h6M6 13h4" {...s12} {...cap} /><circle cx="14" cy="15" r="3" {...s12} /><path d="M16 17l1 1" {...s12} {...cap} /></svg>;
}
function SettingsIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}><circle cx="10" cy="10" r="3" {...s15} /><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" {...s15} {...cap} /></svg>;
}
function LogoutIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M7 15H4.5A1.5 1.5 0 013 13.5v-9A1.5 1.5 0 014.5 3H7M12 12.5L15 9l-3-3.5M15 9H7" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/staff", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/staff/user-approval", label: "User Approval", icon: <UserApprovalIcon /> },
  { href: "/staff/participants", label: "Participants", icon: <ParticipantsIcon /> },
  { href: "/staff/teams", label: "Teams", icon: <TeamsIcon /> },
  { href: "/staff/submissions", label: "Submissions", icon: <SubmissionsIcon /> },
  { href: "/staff/disqualification", label: "Disqualifications", icon: <DisqualifyIcon /> },
  { href: "/staff/rankings", label: "Rankings", icon: <RankingsIcon /> },
  { href: "/staff/promotions", label: "Promotions", icon: <PromotionsIcon /> },
  { href: "/staff/awards", label: "Awards", icon: <AwardsIcon /> },
  { href: "/staff/announcements", label: "Announcements", icon: <AnnouncementsIcon /> },
  { href: "/staff/audit-log", label: "Audit Log", icon: <AuditLogIcon /> },
];

export function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    if (typeof window !== "undefined") localStorage.removeItem("access_token");
    router.push("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "S";

  return (
    <aside className="seal-sidebar-bg flex w-60 min-h-screen flex-shrink-0 flex-col p-4">
      {/* Logo */}
      <div className="pb-5">
        <Link href="/staff" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-seal-blue/20 to-seal-cyan/10 ring-1 ring-white/10">
            <Image src="/logo-removebg-preview.png" alt="SEAL" width={28} height={28} className="brightness-0 invert" />
          </div>
          <div>
            <span className="font-heading text-[15px] font-extrabold tracking-tight text-white">
              SEAL <span className="text-seal-blue-light">Hackathon</span>
            </span>
            <p className="text-[10px] font-medium tracking-widest text-seal-blue/50">STAFF PORTAL</p>
          </div>
        </Link>
      </div>

      <div className="mb-5 h-px bg-gradient-to-r from-transparent via-seal-blue/20 to-transparent" />

      {/* User profile */}
      <div className="mb-5">
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 backdrop-blur-sm">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-seal-blue/30 to-seal-cyan/20 ring-1 ring-seal-blue/20">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold tracking-wider text-white">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">{user?.name ?? "Staff"}</p>
            <p className="truncate text-[11px] font-medium text-seal-blue-light/70">Staff</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Staff navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 ${
                isActive
                  ? "seal-sidebar-item-active bg-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-200 text-seal-blue-light"
                  : "rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-200 text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <span className={isActive ? "text-seal-blue-light" : "text-slate-500"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-0.5 pt-2">
        <div className="mb-2 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <Link
          href="/staff/support"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium tracking-wide text-slate-500 transition-colors duration-200 hover:bg-white/[0.04] hover:text-slate-300"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.2" /><path d="M6.5 6.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M9 13h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          Support
        </Link>
        <Link
          href="/staff/settings"
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
