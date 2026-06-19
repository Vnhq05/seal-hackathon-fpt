"use client";

import { useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
      <path d="M12 12L16 16" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
      <path d="M12 7A4 4 0 004 7c0 4.5-2 6-2 6h12s-2-1.5-2-6M6.27 16a2 2 0 003.46 0" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3" stroke="#94a3b8" strokeWidth="1.2" />
      <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function JudgeTopNav() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "J";

  return (
    <header className="seal-topnav sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-between px-6">
      <div className="flex items-center gap-2 rounded-lg border border-seal-border bg-seal-surface-elevated/50 px-3 py-2 transition-all duration-200 focus-within:border-seal-amber/30 focus-within:ring-2 focus-within:ring-seal-amber/10" style={{ width: 240 }}>
        <SearchIcon />
        <input
          type="text"
          placeholder="Search submissions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border-none bg-transparent text-[13px] font-medium text-seal-text outline-none placeholder:text-seal-text-muted"
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-lg p-2 text-seal-text-muted transition-all duration-200 hover:bg-seal-surface-elevated hover:text-seal-text"><BellIcon /></button>
        <button type="button" className="rounded-lg p-2 text-seal-text-muted transition-all duration-200 hover:bg-seal-surface-elevated hover:text-seal-text"><GearIcon /></button>
        <div className="ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-seal-border bg-gradient-to-br from-seal-amber/10 to-seal-orange/5 transition-all duration-200 hover:border-seal-amber/30">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[11px] font-bold text-seal-amber">{initials}</span>
          )}
        </div>
      </div>
    </header>
  );
}
