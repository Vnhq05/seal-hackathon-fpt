import { eventApi, type PublishEventRequest } from "@/lib/api/event.api";
import { roundApi } from "@/lib/api/round.api";
import type { EventWizardData } from "@/features/admin/store/event-wizard.store";
import { getEventEndDate } from "@/features/admin/utils/event-wizard.utils";

export interface PartialPublishFailure {
  eventId: string;
  eventName: string;
  message: string;
}

export function buildPublishPayload(
  data: EventWizardData,
  systemConfig: { minTeams?: number | null; maxTeams?: number | null } | undefined,
): PublishEventRequest {
  const endDate = data.startDate ? getEventEndDate(data.startDate, data.duration) : data.startDate;

  return {
    name: data.name,
    season: data.season,
    year: data.year,
    competitionFormat: data.competitionFormat,
    startDate: data.startDate,
    endDate,
    registrationDeadline: data.registrationDeadline,
    registrationOpenDate: data.registrationOpenDate || undefined,
    description: data.description || undefined,
    location: data.location || undefined,
    format: data.format,
    minTeam: systemConfig?.minTeams ?? undefined,
    maxTeam: systemConfig?.maxTeams ?? undefined,
    semesterMin: data.semesterMin ?? undefined,
    semesterMax: data.semesterMax ?? undefined,
    scoringTemplateId: data.applyToAllTracks ? data.scoringTemplateId ?? undefined : undefined,
    tiebreakerCriteria: data.tiebreakerCriteria || undefined,
    tiebreakerCriterionIds:
      data.tiebreakerCriterionIds.length > 0 ? data.tiebreakerCriterionIds : undefined,
    tracks:
      data.competitionFormat === "SEAL_RAG_2026"
        ? undefined
        : data.tracks.map((t) => ({
            name: t.name,
            description: t.description || undefined,
            maxTeams: t.maxTeams,
            scoringTemplateId: data.applyToAllTracks ? undefined : t.scoringTemplateId ?? undefined,
          })),
    prizes:
      data.competitionFormat === "SEAL_RAG_2026"
        ? undefined
        : data.prizes.map((p) => ({
            rank: p.rank,
            value: p.value,
            quantity: p.quantity,
            label: p.label,
            trackId: p.trackId,
            trackIndex: data.applyPrizesToAllTracks ? undefined : p.trackIndex,
          })),
    honoredGuests: data.honoredGuests.map((g) => ({
      fullName: g.fullName,
      title: g.title || undefined,
    })),
    rounds:
      data.competitionFormat === "SEAL_RAG_2026"
        ? undefined
        : data.rounds.map((r, i) => ({
            roundNumber: i + 1,
            name: r.name,
            startDate: r.startDate,
            endDate: r.endDate,
            submissionDeadline: r.endDate,
            scoringDeadline: r.endDate,
            advancementCutoff: r.advancementCutoff,
            roundWeight: data.rounds.length === 1 ? 100 : r.roundWeight,
            roundType:
              data.rounds.length > 1 && i === data.rounds.length - 1 ? "FINAL" : "PRELIMINARY",
          })),
  };
}

function isPublishEndpointMissing(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("404") || msg.includes("not found") || msg.includes("no static resource");
}

async function publishWithRollback(payload: PublishEventRequest): Promise<string> {
  const { rounds = [], ...eventPayload } = payload;
  let eventId: string | null = null;

  try {
    const created = await eventApi.create(eventPayload);
    eventId = created.id;

    if (eventPayload.competitionFormat === "SEAL_RAG_2026") {
      return eventId!;
    }

    for (let i = 0; i < rounds.length; i++) {
      const roundRequest = rounds[i];
      await roundApi.create(created.id, roundRequest);
    }

    return eventId!;
  } catch (err) {
    if (eventId) {
      try {
        await eventApi.delete(eventId);
        const reason = err instanceof Error ? err.message : "Publish failed";
        throw new Error(`${reason} The incomplete draft was removed automatically.`);
      } catch {
        const reason = err instanceof Error ? err.message : "Publish failed";
        const partial: PartialPublishFailure = {
          eventId,
          eventName: eventPayload.name,
          message: reason,
        };
        throw partial;
      }
    }
    throw err;
  }
}

export async function publishEvent(payload: PublishEventRequest): Promise<string | null> {
  try {
    const response = await eventApi.publish(payload);
    return response.id ?? null;
  } catch (err) {
    if (isPublishEndpointMissing(err)) {
      return publishWithRollback(payload);
    }
    throw err;
  }
}

export function isPartialPublishFailure(err: unknown): err is PartialPublishFailure {
  return (
    typeof err === "object" &&
    err !== null &&
    "eventId" in err &&
    "eventName" in err &&
    "message" in err
  );
}
