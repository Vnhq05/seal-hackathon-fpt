/** SEAL Spring 2026 per-criterion scoring scale (1–5). */
export const DEFAULT_MIN_SCORE = 1;
export const DEFAULT_MAX_SCORE = 5;

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
