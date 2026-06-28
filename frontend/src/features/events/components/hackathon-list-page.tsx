"use client";

import { useState } from "react";
import { useHackathons } from "@/features/events/hooks/use-hackathons";
import { HackathonCard } from "@/features/events/components/hackathon-card";
import { HackathonFilters } from "@/features/events/components/hackathon-filters";
import { SearchIcon } from "@/features/events/components/hackathon-icons";
import type { HackathonFilterTab } from "@/features/events/types/hackathon.types";
import type { EventStatus } from "@/lib/api";

function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]" style={{ border: "1px solid rgba(198, 198, 205, 0.3)" }}>
      <div style={{ height: 128, backgroundColor: "rgba(223,226,236,0.8)" }} />
      <div className="flex flex-col gap-3 p-6">
        <div className="rounded" style={{ height: 20, width: "60%", backgroundColor: "rgba(223,226,236,0.8)" }} />
        <div className="rounded" style={{ height: 14, width: "90%", backgroundColor: "rgba(223,226,236,0.8)" }} />
        <div className="rounded" style={{ height: 14, width: "70%", backgroundColor: "rgba(223,226,236,0.8)" }} />
        <div className="rounded" style={{ height: 12, width: "50%", backgroundColor: "rgba(223,226,236,0.8)" }} />
        <div className="mt-2 rounded" style={{ height: 1, backgroundColor: "rgba(198, 198, 205, 0.3)" }} />
        <div className="rounded" style={{ height: 30, width: "40%", backgroundColor: "rgba(223,226,236,0.8)", alignSelf: "flex-end" }} />
      </div>
    </div>
  );
}

export function HackathonListPage() {
  const [activeTab, setActiveTab] = useState<HackathonFilterTab>("all");
  const [search, setSearch] = useState("");

  // Map UI filter tabs to backend EventStatus values
  const statusMap: Record<string, EventStatus | undefined> = {
    all: undefined,
    open: "OPEN",
    ongoing: "ACTIVE",
    upcoming: "UPCOMING",
    ended: "COMPLETED",
  };

  const params = {
    status: statusMap[activeTab],
  };

  const { data, isLoading } = useHackathons(params);
  const hackathons = data?.content ?? [];

  return (
    <div>
      <div
        className="flex flex-col gap-6 p-8"
        style={{ backgroundColor: "rgba(252, 248, 250, 0.9)", backdropFilter: "blur(6px)" }}
      >
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
              Hackathons
            </h1>
            <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
              Discover, join, and compete in the latest events.
            </p>
          </div>

          <div className="relative" style={{ width: 288 }}>
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search hackathons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
              style={{
                border: "1px solid rgba(223,226,236,0.8)",
                backgroundColor: "#ffffff",
                padding: "11px 17px 11px 41px",
                fontSize: 14,
                color: "#0e1528",
                outline: "none",
              }}
            />
          </div>
        </div>

        <HackathonFilters active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="grid grid-cols-2 gap-6 p-8">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : hackathons.length === 0
            ? (
              <div className="col-span-2 py-16 text-center" style={{ color: "#8891a5", fontSize: 14 }}>
                No hackathons found.
              </div>
            )
            : hackathons.map((h) => <HackathonCard key={h.id} hackathon={h} />)
        }
      </div>
    </div>
  );
}
