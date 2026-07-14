"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import type { EventResponse } from "@/lib/api/event.api";
import type { Page } from "@/lib/api/types";
import { SealCard } from "@/shared/ui/seal-card";

export function LiveScoreListPage({ portalBase = "/admin" }: { portalBase?: string }) {
  const { data, isLoading } = useQuery<Page<EventResponse>>({
    queryKey: ["admin-events-livescore"],
    queryFn: () => eventApi.list({ status: "ACTIVE" }),
  });

  const events = data?.content ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl px-2 py-2 sm:px-4">
      <header className="mb-8 border-b-2 border-navy/10 pb-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-navy sm:text-[32px]">
          LiveScore Arena
        </h1>
        <p className="mt-2 text-sm text-seal-text-muted">
          Select an event to view real-time rankings.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <SealCard className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-base font-semibold text-navy">No active events</p>
          <p className="mt-1 text-sm text-seal-text-muted">
            LiveScore is available for active events only.
          </p>
        </SealCard>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`${portalBase}/livescore/${event.id}`}
              className="group flex items-center justify-between gap-4 border-2 border-navy bg-white px-5 py-4 no-underline shadow-[4px_4px_0_0_#0c1228] transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-navy">{event.name}</p>
                <p className="mt-1 text-[13px] text-seal-text-muted">
                  {event.season} {event.year} · {event.trackCount} tracks · {event.roundCount} rounds
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                  {event.status}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-seal-text-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                >
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
