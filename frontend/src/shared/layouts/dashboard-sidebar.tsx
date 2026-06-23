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
function TeamIcon() {
  return <svg width="24" height="12" viewBox="0 0 24 12" {...svgProps}><circle cx="8" cy="4" r="2.5" {...s15} /><path d="M2 12c0-2.761 2.239-5 5-5" {...s15} {...cap} /><circle cx="16" cy="4" r="2" {...s15} /><path d="M22 12c0-2.21-1.343-4-3-4" {...s15} {...cap} /></svg>;
}
function MentorHubIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}><path d="M2 16V4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4z" {...s15} {...cap} strokeLinejoin="round" /></svg>;
}
function SubmissionsIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}><path d="M10 2v10M6 8l4 4 4-4" {...s15} {...cap} /><path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" {...s15} {...cap} /></svg>;
}
function LeaderboardIcon() {
  return <svg width="20" height="18" viewBox="0 0 20 18" {...svgProps}><rect x="2" y="8" width="4" height="10" rx="1" {...s15} /><rect x="8" y="2" width="4" height="16" rx="1" {...s15} /><rect x="14" y="5" width="4" height="13" rx="1" {...s15} /></svg>;
}
function SettingsIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}><circle cx="10" cy="10" r="3" {...s15} /><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" {...s15} {...cap} /></svg>;
}
function SupportIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}><circle cx="10" cy="10" r="8.5" {...s12} /><path d="M7.5 7.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M10 14h.01" {...s12} {...cap} /></svg>;
}
function SignOutIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M7 15H4.5A1.5 1.5 0 013 13.5v-9A1.5 1.5 0 014.5 3H7M12 12.5L15 9l-3-3.5M15 9H7" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/student", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/student/teams", label: "Teams", icon: <TeamIcon /> },
  { href: "/student/submissions", label: "Submissions", icon: <SubmissionsIcon /> },
  { href: "/student/leaderboard", label: "Leaderboard", icon: <LeaderboardIcon /> },
  { href: "/student/mentor-hub", label: "MentorHub", icon: <MentorHubIcon /> },
  { href: "/student/settings", label: "Settings", icon: <SettingsIcon /> },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    if (typeof window !== "undefined") localStorage.removeItem("access_token");
    router.push("/login");
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <aside className="seal-sidebar-bg flex w-60 min-h-screen flex-shrink-0 flex-col p-4">
      {/* Logo */}
      <div className="pb-5">
        <Link href="/student" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-seal-cyan/20 to-seal-blue/10 ring-1 ring-white/10">
            <Image src="/logo-removebg-preview.png" alt="SEAL" width={28} height={28} className="brightness-0 invert" />
          </div>
          <div>
            <span className="font-heading text-[15px] font-extrabold tracking-tight text-white">
              SEAL <span className="text-seal-cyan">Hackathon</span>
            </span>
            <p className="text-[10px] font-medium tracking-widest text-seal-cyan/50">STUDENT</p>
          </div>
        </Link>
      </div>

      <div className="mb-5 h-px bg-gradient-to-r from-transparent via-seal-cyan/20 to-transparent" />

      {/* User Profile */}
      <div className="mb-5">
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 backdrop-blur-sm">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-seal-cyan/30 to-seal-blue/20 ring-1 ring-seal-cyan/20">
            <span className="text-xs font-bold tracking-wider text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">
              {user?.fullName ?? "User"}
            </p>
            <p className="truncate text-[11px] font-medium text-seal-cyan/70">
              Student
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/student"
              ? pathname === "/student"
              : pathname.startsWith(item.href) ||
                (item.href === "/student/settings" && pathname.startsWith("/student/profile"));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 ${
                isActive
                  ? "seal-sidebar-item-active bg-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-200 text-seal-cyan"
                  : "rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-200 text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <span className={isActive ? "text-seal-cyan" : "text-slate-500"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-3">
        <Link
          href="/student/submissions"
          className="flex items-center justify-center gap-2 rounded-lg bg-seal-cyan px-4 py-2.5 text-[13px] font-bold text-white transition-colors duration-200 hover:bg-seal-cyan-dark"
        >
          Submit Project
        </Link>

        <div className="my-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="flex flex-col gap-0.5">
          <Link
            href="/student/support"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium tracking-wide text-slate-500 transition-colors duration-200 hover:bg-white/[0.04] hover:text-slate-300"
          >
            <SupportIcon />
            Support
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-none bg-transparent px-3 py-2 text-[13px] font-medium tracking-wide text-slate-500 transition-colors duration-200 hover:bg-seal-error/10 hover:text-seal-error"
          >
            <SignOutIcon />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
