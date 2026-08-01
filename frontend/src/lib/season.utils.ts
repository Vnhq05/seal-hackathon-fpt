/** FPT academic seasons: Spring (Feb–May), Summer (Jun–Sep), Fall (Oct–Jan). */
export const SEASONS = ["Spring", "Summer", "Fall"] as const;

export type Season = (typeof SEASONS)[number];

const ALIASES: Record<string, Season> = {
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
  autumn: "Fall",
  winter: "Fall",
  fail: "Fall",
};

/** Map legacy Winter/Autumn (and casing variants) to canonical Spring|Summer|Fall. */
export function normalizeSeason(season: string | null | undefined): string {
  if (season == null || !String(season).trim()) return "";
  const key = String(season).trim().toLowerCase();
  if (ALIASES[key]) return ALIASES[key];
  const trimmed = String(season).trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function isValidSeason(season: string | null | undefined): season is Season {
  return SEASONS.includes(normalizeSeason(season) as Season);
}

/** Unique canonical seasons from a list (hides Winter as Fall). */
export function uniqueCanonicalSeasons(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map(normalizeSeason).filter(Boolean))].sort();
}

export function formatSeasonYear(
  season: string | null | undefined,
  year: number | string | null | undefined,
): string {
  const s = normalizeSeason(season) || (season ? String(season).trim() : "");
  if (!s && (year == null || year === "")) return "";
  if (!s) return String(year);
  if (year == null || year === "") return s;
  return `${s} ${year}`;
}
