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
  return <svg width="14" height="14" viewBox="0 0 14 14" {...svgProps}><rect x="1" y="1" width="5" height="5" rx="1" {...s15} /><rect x="8" y="1" width="5" height="5" rx="1" {...s15} /><rect x="1" y="8" width="5" height="5" rx="1" {...s15} /><rect x="8" y="8" width="5" height="5" rx="1" {...s15} /></svg>;
}
function RoundsIcon() {
  return <svg width="16" height="17" viewBox="0 0 16 17" {...svgProps}><circle cx="8" cy="9" r="6.5" {...s12} /><path d="M8 5.5v3.5l2.5 1.5" {...s12} {...cap} /></svg>;
}
function SubmissionsIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" {...svgProps}><rect x="2" y="1" width="11" height="13" rx="2" {...s12} /><path d="M5 4.5h5M5 7.5h5M5 10.5h3" stroke="currentColor" strokeWidth="1" {...cap} /></svg>;
}
function HistoryIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" {...svgProps}><path d="M1 3v4h4" {...s12} {...cap} strokeLinejoin="round" /><path d="M3 10A6 6 0 112 6" {...s12} {...cap} /></svg>;
}
function BellIcon() {
  return <svg width="12" height="15" viewBox="0 0 12 15" {...svgProps}><path d="M9 5.5a3 3 0 00-6 0c0 3.5-1.5 4.5-1.5 4.5h9S9 9 9 5.5M4.5 12a1.5 1.5 0 003 0" {...s12} {...cap} /></svg>;
}
function SupportIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" {...svgProps}><circle cx="7.5" cy="7.5" r="6" {...s12} /><path d="M5.5 5.5a2 2 0 014 1c0 1.2-2 1.6-2 2" {...s12} {...cap} /><circle cx="7.5" cy="11" r="0.4" fill="currentColor" /></svg>;
}
function SettingsIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" {...svgProps}><circle cx="7.5" cy="7.5" r="2.5" {...s12} /><path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3 3l1 1M11 11l1 1M3 12l1-1M11 4l1-1" {...s12} {...cap} /></svg>;
}
function LogoutIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M7 15H4.5A1.5 1.5 0 013 13.5v-9A1.5 1.5 0 014.5 3H7M12 12.5L15 9l-3-3.5M15 9H7" {...s12} {...cap} strokeLinejoin="round" /></svg>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/judge", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/judge/rounds", label: "Assigned Rounds", icon: <RoundsIcon /> },
  { href: "/judge/scoring", label: "Submissions to Score", icon: <SubmissionsIcon /> },
  { href: "/judge/history", label: "Score History", icon: <HistoryIcon /> },
  { href: "/judge/notifications", label: "Notifications", icon: <BellIcon /> },
];

export function JudgeSidebar() {
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
    : "J";

  return (
    <aside className="seal-sidebar-bg flex w-60 min-h-screen flex-shrink-0 flex-col p-4">
      {/* Logo */}
      <div className="pb-5">
        <Link href="/judge" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-seal-amber/20 to-seal-orange/10 ring-1 ring-white/10">
            <Image src="/logo-removebg-preview.png" alt="SEAL" width={28} height={28} className="brightness-0 invert" />
          </div>
          <div>
            <span className="font-heading text-[15px] font-extrabold tracking-tight text-white">
              SEAL <span className="text-seal-amber">Hackathon</span>
            </span>
            <p className="text-[10px] font-medium tracking-widest text-seal-amber/50">JUDGE PORTAL</p>
          </div>
        </Link>
      </div>

      <div className="mb-5 h-px bg-gradient-to-r from-transparent via-seal-amber/20 to-transparent" />

      {/* User Profile */}
      <div className="mb-5">
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 backdrop-blur-sm">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-seal-amber/30 to-seal-orange/20 ring-1 ring-seal-amber/20">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold tracking-wider text-white">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">{user?.name ?? "Judge"}</p>
            <p className="truncate text-[11px] font-medium text-seal-amber/70">Judge</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1" aria-label="Judge navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/judge"
            ? pathname === "/judge"
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 ${
                isActive
                  ? "seal-sidebar-item-active bg-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-200 text-seal-amber"
                  : "rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-200 text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <span className={isActive ? "text-seal-amber" : "text-slate-500"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-3">
        <Link
          href="/judge/rounds"
          className="flex items-center justify-center gap-2 rounded-lg bg-seal-amber px-4 py-2.5 text-[13px] font-bold text-white transition-colors duration-200 hover:bg-amber-600"
        >
          Start Judging
        </Link>

        <div className="my-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="flex flex-col gap-0.5">
          <Link
            href="/judge/support"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium tracking-wide text-slate-500 transition-colors duration-200 hover:bg-white/[0.04] hover:text-slate-300"
          >
            <SupportIcon />
            Support
          </Link>
          <Link
            href="/judge/settings"
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
      </div>
    </aside>
  );
}
