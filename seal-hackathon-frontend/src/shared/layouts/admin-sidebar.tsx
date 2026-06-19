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
function HackathonIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M9 1l2.47 5.01L17 6.81l-4 3.9.94 5.49L9 13.61l-4.94 2.59L5 10.71l-4-3.9 5.53-.8L9 1z" {...s15} /></svg>;
}
function RoundsIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="9" cy="9" r="7" {...s15} /><path d="M9 5v4l3 2" {...s15} {...cap} /></svg>;
}
function TracksIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M2 5h14M2 9h14M2 13h14" {...s15} {...cap} /></svg>;
}
function CriteriaIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M4 9l3 3 7-7" {...s15} {...cap} strokeLinejoin="round" /><rect x="1" y="1" width="16" height="16" rx="3" {...s15} /></svg>;
}
function AssignmentIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="7" cy="5" r="3" {...s12} /><path d="M1 16c0-3.314 2.686-6 6-6s6 2.686 6 6" {...s12} {...cap} /><path d="M14 8l2 2 2-2" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}
function UsersIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="6" cy="5" r="3" {...s12} /><path d="M1 16c0-3 2.5-5.5 5-5.5s5 2.5 5 5.5" {...s12} {...cap} /><circle cx="13" cy="6" r="2" {...s12} /><path d="M17 16c0-2-1.5-4-4-4" {...s12} {...cap} /></svg>;
}
function SystemIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="9" cy="9" r="3" {...s15} /><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.5 3.5l1.4 1.4M13.1 13.1l1.4 1.4M3.5 14.5l1.4-1.4M13.1 4.9l1.4-1.4" {...s15} {...cap} /></svg>;
}
function AnalyticsIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><rect x="2" y="10" width="3" height="6" rx="0.5" {...s12} /><rect x="7.5" y="5" width="3" height="11" rx="0.5" {...s12} /><rect x="13" y="2" width="3" height="14" rx="0.5" {...s12} /></svg>;
}
function ExportIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M9 2v10M5 8l4 4 4-4M3 14h12" {...s15} {...cap} /></svg>;
}
function SupportIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="9" cy="9" r="7.5" {...s12} /><path d="M6.5 6.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M9 13h.01" {...s12} {...cap} /></svg>;
}
function SettingsIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="9" cy="9" r="3" {...s12} /><path d="M9 1v2M9 15v2M1 9h2M15 9h2" {...s12} {...cap} /></svg>;
}
function LogoutIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M7 15H4.5A1.5 1.5 0 013 13.5v-9A1.5 1.5 0 014.5 3H7M12 12.5L15 9l-3-3.5M15 9H7" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/admin/hackathons", label: "Hackathons", icon: <HackathonIcon /> },
  { href: "/admin/rounds", label: "Rounds", icon: <RoundsIcon /> },
  { href: "/admin/tracks", label: "Tracks", icon: <TracksIcon /> },
  { href: "/admin/criteria", label: "Criteria", icon: <CriteriaIcon /> },
  { href: "/admin/assignments", label: "Assignments", icon: <AssignmentIcon /> },
  { href: "/admin/users", label: "Users", icon: <UsersIcon /> },
  { href: "/admin/system", label: "System Config", icon: <SystemIcon /> },
  { href: "/admin/analytics", label: "Analytics", icon: <AnalyticsIcon /> },
  { href: "/admin/export", label: "Export", icon: <ExportIcon /> },
];

export function AdminSidebar() {
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
    : "A";

  return (
    <aside className="seal-sidebar-bg flex w-60 min-h-screen flex-shrink-0 flex-col p-4">
      {/* Logo */}
      <div className="pb-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-seal-purple/20 to-seal-pink/10 ring-1 ring-white/10">
            <Image src="/logo-removebg-preview.png" alt="SEAL" width={28} height={28} className="brightness-0 invert" />
          </div>
          <div>
            <span className="font-heading text-[15px] font-extrabold tracking-tight text-white">
              SEAL <span className="text-seal-purple-light">Hackathon</span>
            </span>
            <p className="text-[10px] font-medium tracking-widest text-seal-purple/50">ADMIN PORTAL</p>
          </div>
        </Link>
      </div>

      {/* CTA */}
      <div className="mb-5">
        <Link
          href="/admin/hackathons/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-seal-purple px-4 py-2.5 text-[13px] font-bold text-white transition-colors duration-200 hover:bg-seal-purple-dark"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Create Hackathon
        </Link>
      </div>

      <div className="mb-5 h-px bg-gradient-to-r from-transparent via-seal-purple/20 to-transparent" />

      {/* User profile */}
      <div className="mb-5">
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 backdrop-blur-sm">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-seal-purple/30 to-seal-pink/20 ring-1 ring-seal-purple/20">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold tracking-wider text-white">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">{user?.name ?? "Admin"}</p>
            <p className="truncate text-[11px] font-medium text-seal-purple-light/70">Administrator</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Admin navigation">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 ${
                isActive
                  ? "seal-sidebar-item-active bg-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-200 text-seal-purple-light"
                  : "rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-200 text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <span className={isActive ? "text-seal-purple-light" : "text-slate-500"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-0.5 pt-2">
        <div className="mb-2 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <Link
          href="/admin/support"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium tracking-wide text-slate-500 transition-colors duration-200 hover:bg-white/[0.04] hover:text-slate-300"
        >
          <SupportIcon />
          Support
        </Link>
        <Link
          href="/admin/settings"
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
