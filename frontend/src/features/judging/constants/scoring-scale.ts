/** Default per-criterion scoring scale (1–100). */
export const DEFAULT_MIN_SCORE = 1;
export const DEFAULT_MAX_SCORE = 100;

/** Allowed max values for the admin scale picker (min is always 1). */
export const SCORE_SCALE_MAX_OPTIONS = [5, 10, 100] as const;
export type ScoreScaleMax = (typeof SCORE_SCALE_MAX_OPTIONS)[number];

export const SCORE_SCALE_OPTIONS: ReadonlyArray<{
  max: ScoreScaleMax;
  label: string;
  description: string;
}> = [
  { max: 100, label: "1–100", description: "Percentage-style scale (default)" },
  { max: 10, label: "1–10", description: "Ten-point scale" },
  { max: 5, label: "1–5", description: "Current SEAL Likert scale" },
];

export function isScoreScaleMax(value: number): value is ScoreScaleMax {
  return (SCORE_SCALE_MAX_OPTIONS as readonly number[]).includes(value);
}

/** Infer a preset max from criteria; falls back to default 100 when mixed/unknown. */
export function inferScoreScaleMax(
  criteria: ReadonlyArray<{ minScore?: number | null; maxScore?: number | null }>,
): ScoreScaleMax {
  if (!criteria.length) return DEFAULT_MAX_SCORE;
  const maxes = criteria.map((c) => c.maxScore ?? DEFAULT_MAX_SCORE);
  const mins = criteria.map((c) => c.minScore ?? DEFAULT_MIN_SCORE);
  const firstMax = maxes[0];
  const uniform =
    maxes.every((m) => m === firstMax) && mins.every((m) => m === DEFAULT_MIN_SCORE);
  if (uniform && isScoreScaleMax(firstMax)) return firstMax;
  return DEFAULT_MAX_SCORE;
}

export function formatScoreScale(max: ScoreScaleMax): string {
  return `${DEFAULT_MIN_SCORE}–${max}`;
}

/** SEAL Spring 2026 labels for the 1–5 Likert scale only. */
export const SEAL_SCORE_LABELS: Record<number, string> = {
  1: "Weak",
  2: "Below Standard",
  3: "Meets Standard",
  4: "Good",
  5: "Excellent",
};

/** Short labels for compact radio buttons in the scoring table. */
export const SEAL_SCORE_BUTTON_LABELS: Record<number, string> = {
  1: "Weak",
  2: "Below Std",
  3: "Meets Std",
  4: "Good",
  5: "Excellent",
};

export function getScoreLabel(score: number): string | undefined {
  return SEAL_SCORE_LABELS[score];
}

export function formatScoreRange(minScore: number, maxScore: number): string {
  return `${minScore}–${maxScore}`;
}

/** Prefer discrete buttons only for small ranges (e.g. 1–5 / 1–10). */
export const MAX_DISCRETE_SCORE_BUTTONS = 10;
