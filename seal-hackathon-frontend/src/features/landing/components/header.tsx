"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Explore", href: "#featured" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Tracks", href: "#tracks" },
  { label: "About", href: "#platform" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled
          ? "seal-glass border-b border-seal-cyan/10 shadow-lg shadow-seal-cyan/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-seal-cyan/15 to-seal-blue/10 ring-1 ring-seal-cyan/20">
            <Image src="/logo-removebg-preview.png" alt="SEAL Hackathon" width={28} height={28} className="brightness-0 invert" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-seal-text">
            SEAL <span className="text-seal-cyan">Hackathon</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-xl px-4 py-2 text-[13px] font-semibold text-seal-text-secondary transition-all duration-200 hover:bg-seal-cyan/5 hover:text-seal-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-xl px-5 py-2 text-sm font-semibold text-seal-text-secondary transition-all duration-200 hover:text-seal-text"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-gradient-to-r from-seal-cyan to-seal-blue px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-seal-cyan/20 transition-all duration-300 hover:shadow-xl hover:shadow-seal-cyan/30 hover:brightness-110"
          >
            Join SEAL
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-seal-text-secondary transition-colors hover:bg-seal-cyan/10 lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="seal-glass border-t border-seal-cyan/10 px-4 pb-6 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-seal-text-secondary transition-colors hover:bg-seal-cyan/5 hover:text-seal-text"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-seal-cyan/10 pt-4">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-seal-text-secondary"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl bg-gradient-to-r from-seal-cyan to-seal-blue px-5 py-3 text-center text-sm font-bold text-white shadow-lg shadow-seal-cyan/20"
            >
              Join SEAL
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
