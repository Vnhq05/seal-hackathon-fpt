"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import type { EventResponse } from "@/lib/api/event.api";
import type { Page } from "@/lib/api/types";

export function LiveScoreListPage({ portalBase = "/admin" }: { portalBase?: string }) {
  const { data, isLoading } = useQuery<Page<EventResponse>>({
    queryKey: ["admin-events-livescore"],
    queryFn: () => eventApi.list({ status: "ACTIVE" }),
  });

  const events = data?.content ?? [];

  return (
    <div className="flex flex-col gap-6" style={{ padding: 24, maxWidth: 1000 }}>
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px" }}>
          LiveScore Arena
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
          Select an event to view real-time rankings.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: 64 }}>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
          style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No active events</p>
          <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
            LiveScore is available for active events only.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`${portalBase}/livescore/${event.id}`}
              className="flex items-center justify-between transition-colors hover:bg-slate-50 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
              style={{
                padding: "16px 20px",
                backgroundColor: "#fff",
                border: "1px solid rgba(198,198,205,0.5)",
                textDecoration: "none",
              }}
            >
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>
                  {event.name}
                </p>
                <p style={{ fontSize: 13, color: "#8891a5", marginTop: 2 }}>
                  {event.season} {event.year} &middot; {event.trackCount} tracks &middot; {event.roundCount} rounds
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span style={{
                  fontSize: 11, fontWeight: 600, color: "#065f46", backgroundColor: "#d1fae5",
                  padding: "3px 10px", borderRadius: 4,
                }}>
                  {event.status}
                </span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4l4 4-4 4" stroke="#8891a5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
