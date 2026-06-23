"use client";

import Link from "next/link";
import { useDashboardHackathons } from "@/features/dashboard/hooks/use-dashboard-hackathons";
import { HackathonItem } from "@/features/dashboard/components/hackathon-item";

function HackathonSkeleton() {
  return (
    <div className="animate-pulse rounded-lg" style={{ border: "1px solid rgba(223,226,236,0.8)", padding: "16px", height: 96, backgroundColor: "#f5f5f5" }} />
  );
}

function EmptyHackathons() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg py-12 text-center"
      style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}
    >
      <div
        className="mb-4 flex items-center justify-center rounded-full"
        style={{ width: 52, height: 52, backgroundColor: "#eef0f6" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2l2.09 4.26 4.71.68-3.4 3.32.8 4.67L12 12.5l-4.2 2.43.8-4.67L5.2 6.94l4.71-.68L12 2z"
            stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p style={{ fontSize: "15px", fontWeight: 600, color: "#0e1528" }}>
        No hackathons yet
      </p>
      <p className="mt-1" style={{ fontSize: "13px", color: "rgba(101,217,243,0.2)" }}>
        Explore and register for upcoming hackathons.
      </p>
      <Link
        href="/student/projects"
        className="mt-4 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-indigo-700"
        style={{ backgroundColor: "#38bdf8", color: "#0e1528" }}
      >
        Browse Hackathons
      </Link>
    </div>
  );
}

export function HackathonSection() {
  const { data: hackathons, isLoading } = useDashboardHackathons();

  const items = hackathons ?? [];

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#0e1528" }}>
          My Hackathons
        </h2>
        {items.length > 0 && (
          <Link
            href="/student/projects"
            style={{ fontSize: "13px", color: "#38bdf8", fontWeight: 500 }}
            className="hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col" style={{ gap: "12px" }}>
          {Array.from({ length: 3 }).map((_, i) => <HackathonSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyHackathons />
      ) : (
        <div className="flex flex-col" style={{ gap: "12px" }}>
          {items.slice(0, 5).map((h) => (
            <HackathonItem key={h.id} hackathon={h} />
          ))}
        </div>
      )}
    </section>
  );
}
