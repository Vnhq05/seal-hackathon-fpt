"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { PixelButton, PixelLogo } from "./landing-ui";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Events", href: "#featured" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Roles", href: "#roles" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-navy/10 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <PixelLogo />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="whitespace-nowrap px-2 py-2 font-mono text-[10px] font-semibold uppercase tracking-wide text-seal-text-secondary transition-colors hover:text-royal xl:text-[11px]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <PixelButton href="/login" variant="ghost" className="h-10 px-4 text-xs">
            Sign In
          </PixelButton>
          <PixelButton href="/register" variant="primary" className="h-10 px-4 text-xs">
            Register
          </PixelButton>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center border-2 border-navy/20 bg-white lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t-2 border-navy/10 bg-white px-4 pb-6 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="border border-transparent px-3 py-2.5 font-mono text-sm font-semibold text-seal-text-secondary hover:border-navy/10 hover:bg-seal-surface-sunken hover:text-navy"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-navy/10 pt-4">
            <PixelButton href="/login" variant="secondary" className="w-full">
              Sign In
            </PixelButton>
            <PixelButton href="/register" variant="primary" className="w-full">
              Register
            </PixelButton>
          </div>
        </div>
      ) : null}
    </header>
  );
}
