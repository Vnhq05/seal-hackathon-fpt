"use client";

import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import {
  useMyParticipationCertificate,
  useParticipationSummary,
  usePublicAwards,
} from "@/features/coordinator/hooks/use-awards";

export function AwardsResultsPage() {
  const { data: events } = useQuery({
    queryKey: ["award-events"],
    queryFn: () => eventApi.list({ size: 20 }).then((p) => p.content),
  });

  const sealEvent = events?.find((e) => e.competitionFormat === "SEAL_RAG_2026") ?? events?.[0];
  const eventId = sealEvent?.id;

  const { data: awards, isLoading } = usePublicAwards(eventId, !!eventId);
  const { data: participationSummary } = useParticipationSummary(eventId, !!eventId);
  const { data: myCertificate } = useMyParticipationCertificate(eventId, !!eventId);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Results & Awards</h1>
        {sealEvent && <p className="text-sm text-seal-text-secondary">{sealEvent.name}</p>}
      </div>

      {isLoading && <p className="text-sm text-seal-text-muted">Loading...</p>}

      {!isLoading && (!awards || awards.length === 0) && (
        <p className="rounded-lg border border-navy/20 bg-white p-6 text-sm text-seal-text-secondary">
          Awards have not been announced yet.
        </p>
      )}

      {awards && awards.length > 0 && (
        <ul className="space-y-3">
          {awards.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between border-2 border-navy bg-white px-4 py-3 shadow-[3px_3px_0_0_#0c1228]"
            >
              <div>
                <p className="font-mono text-xs font-bold uppercase text-royal">{a.prizeLabel}</p>
                <p className="font-semibold text-navy">{a.teamName}</p>
              </div>
              <p className="font-mono text-sm text-navy">
                {Number(a.prizeValue).toLocaleString("en-US")} ₫
              </p>
            </li>
          ))}
        </ul>
      )}

      {participationSummary && participationSummary.issuedCount > 0 && (
        <p className="rounded-lg border border-navy/20 bg-white p-4 text-sm text-seal-text-secondary">
          Issued {participationSummary.issuedCount.toLocaleString("en-US")} participation certificates
          to confirmed team members.
        </p>
      )}

      {myCertificate && (
        <div className="border-2 border-royal bg-white px-4 py-3 shadow-[3px_3px_0_0_#0c1228]">
          <p className="font-mono text-xs font-bold uppercase text-royal">
            Your participation certificate
          </p>
          <p className="mt-1 font-semibold text-navy">{myCertificate.userFullName}</p>
          <p className="text-sm text-seal-text-secondary">Team: {myCertificate.teamName}</p>
          <p className="mt-2 text-xs text-seal-text-muted">
            Issued on{" "}
            {new Date(myCertificate.issuedAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
