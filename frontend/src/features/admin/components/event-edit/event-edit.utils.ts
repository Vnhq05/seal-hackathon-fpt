import type { EventResponse, EventStatus, UpdateEventRequest } from "@/lib/api";

export function toDateInput(value: string | null | undefined): string {
  return value ? value.split("T")[0] : "";
}

export function mergeEventUpdate(
  existing: EventResponse,
  patch: Partial<UpdateEventRequest>,
): UpdateEventRequest {
  return {
    name: patch.name ?? existing.name,
    season: patch.season ?? existing.season,
    year: patch.year ?? existing.year,
    startDate: patch.startDate ?? toDateInput(existing.startDate),
    endDate: patch.endDate ?? toDateInput(existing.endDate),
    registrationOpenDate:
      patch.registrationOpenDate !== undefined
        ? patch.registrationOpenDate
        : existing.registrationOpenDate
          ? toDateInput(existing.registrationOpenDate)
          : undefined,
    registrationDeadline:
      patch.registrationDeadline ?? toDateInput(existing.registrationDeadline),
    description:
      patch.description !== undefined
        ? patch.description
        : existing.description ?? undefined,
    location:
      patch.location !== undefined ? patch.location : existing.location ?? undefined,
    format: patch.format ?? existing.format ?? undefined,
    minTeam:
      patch.minTeam !== undefined ? patch.minTeam : existing.minTeam ?? undefined,
    maxTeam:
      patch.maxTeam !== undefined ? patch.maxTeam : existing.maxTeam ?? undefined,
    semesterMin:
      patch.semesterMin !== undefined
        ? patch.semesterMin
        : existing.semesterMin ?? undefined,
    semesterMax:
      patch.semesterMax !== undefined
        ? patch.semesterMax
        : existing.semesterMax ?? undefined,
    scoringTemplateId:
      patch.scoringTemplateId !== undefined
        ? patch.scoringTemplateId ?? undefined
        : existing.scoringTemplateId ?? undefined,
    tiebreakerCriteria:
      patch.tiebreakerCriteria !== undefined
        ? patch.tiebreakerCriteria
        : existing.tiebreakerCriteria ?? undefined,
    tiebreakerCriterionIds:
      patch.tiebreakerCriterionIds !== undefined
        ? patch.tiebreakerCriterionIds
        : existing.tiebreakerCriterionIds ?? undefined,
    prizes:
      patch.prizes !== undefined
        ? patch.prizes
        : existing.prizes.map((p) => ({
            trackId: p.trackId ?? undefined,
            rank: p.rank,
            value: p.value,
            quantity: p.quantity,
            label: p.label ?? undefined,
          })),
    honoredGuests:
      patch.honoredGuests !== undefined
        ? patch.honoredGuests
        : existing.honoredGuests.map((g) => ({
            fullName: g.fullName,
            title: g.title ?? undefined,
          })),
  };
}

export function isEventEditable(status: EventStatus): boolean {
  return status !== "ACTIVE" && status !== "COMPLETED";
}

export const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "11px 16px",
  fontSize: 14,
  width: "100%",
  outline: "none",
};

export const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0e1528",
  marginBottom: 4,
  display: "block",
};

export const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#ef4444",
  marginTop: 4,
};

export const bannerErrorStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#991b1b",
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 8,
  padding: "10px 14px",
};

export const warnBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 12,
  color: "#991b1b",
  marginTop: 4,
};
