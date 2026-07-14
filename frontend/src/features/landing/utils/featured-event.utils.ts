import type { PrizeResponse } from "@/lib/api/event.api";
import type { PrizeRank } from "@/lib/api/event.api";
import {
  formatEventDate,
  formatFormatLabel,
} from "@/features/events/utils/event-landing.utils";

const PRIZE_RANK_ORDER: PrizeRank[] = ["FIRST", "SECOND", "THIRD", "CONSOLATION"];

export function displayOrUpdating(value: string | null | undefined): string {
  return value && value.trim() !== "" ? value : "Updating";
}

export function formatRegistrationPeriod(
  open: string | null | undefined,
  deadline: string | null | undefined,
): string {
  if (!open?.trim() || !deadline?.trim()) return "Updating";
  return `${formatEventDate(open)} - ${formatEventDate(deadline)}`;
}

export function formatOpeningDate(startDate: string | null | undefined): string {
  if (!startDate?.trim()) return "Updating";
  return formatEventDate(startDate);
}

export function formatLocationRow(
  location: string | null | undefined,
  format: string,
): string {
  const formatLabel = formatFormatLabel(format) || format;
  return `${displayOrUpdating(location)} (${formatLabel})`;
}

export function sortPrizesForDisplay(prizes: PrizeResponse[]): PrizeResponse[] {
  return [...prizes].sort((a, b) => {
    const aIndex = PRIZE_RANK_ORDER.indexOf(a.rank);
    const bIndex = PRIZE_RANK_ORDER.indexOf(b.rank);
    return (aIndex === -1 ? PRIZE_RANK_ORDER.length : aIndex) -
      (bIndex === -1 ? PRIZE_RANK_ORDER.length : bIndex);
  });
}

/** Teams / tracks footer line built from event fields; missing pieces become Updating. */
export function formatEventMetaFooter(
  minTeam: number | null | undefined,
  maxTeam: number | null | undefined,
  trackCount: number | null | undefined,
): string {
  const teamPart =
    minTeam != null && maxTeam != null && minTeam > 0 && maxTeam > 0
      ? `Teams of ${minTeam}-${maxTeam} members`
      : "Updating";

  const trackLabel =
    trackCount != null && trackCount > 0
      ? `${trackCount} technology track${trackCount !== 1 ? "s" : ""}`
      : "Updating";

  return `${teamPart} · ${trackLabel}`;
}

export const PARTICIPATION_NOTE =
  "All participants receive a Certificate of Participation";
