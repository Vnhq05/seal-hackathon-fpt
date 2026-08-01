/** Canonical hackathon seasons — matches backend SeasonUtils. */
export const SEASONS = ["Spring", "Summer", "Fall"] as const;

export type Season = (typeof SEASONS)[number];

/**
 * Derive current season from a date.
 * Spring: Jan–Apr · Summer: May–Aug · Fall: Sep–Dec
 */
export function deriveCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1; // 1–12
  if (month <= 4) return "Spring";
  if (month <= 8) return "Summer";
  return "Fall";
}

export function deriveCurrentYear(date: Date = new Date()): number {
  return date.getFullYear();
}

export function isValidSeason(value: string | null | undefined): value is Season {
  return SEASONS.includes(value as Season);
}
