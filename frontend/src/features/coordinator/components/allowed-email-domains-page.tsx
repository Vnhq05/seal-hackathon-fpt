"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { AllowedEmailDomainsPanel } from "@/features/events/components/allowed-email-domains-panel";

export function AllowedEmailDomainsPage() {
  const [eventId, setEventId] = useState<string>("");

  const { data: events = [] } = useQuery({
    queryKey: ["coordinator-events"],
    queryFn: () => eventApi.list({ page: 0, size: 50 }).then((p) => p.content),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-seal-text">Allowed Email Domains</h1>
        <p className="mt-1 text-sm text-seal-text-muted">
          Manage university email domains allowed for external student registration per event.
        </p>
      </div>

      <div className="border-2 border-navy bg-white p-5 shadow-[4px_4px_0_0_#0c1228]">
        <label className="mb-2 block text-sm font-medium text-seal-text">Select event</label>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="w-full max-w-md border-2 border-navy bg-white px-3 py-2 text-sm text-seal-text outline-none focus:border-royal"
        >
          <option value="">Choose an event...</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {!eventId ? (
        <p className="text-sm text-seal-text-muted">Select an event to manage allowed email domains.</p>
      ) : (
        <AllowedEmailDomainsPanel eventId={eventId} />
      )}
    </div>
  );
}
