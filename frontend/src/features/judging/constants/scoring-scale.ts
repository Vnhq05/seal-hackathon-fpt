/** SEAL Spring 2026 per-criterion scoring scale (1–5). */
export const DEFAULT_MIN_SCORE = 1;
export const DEFAULT_MAX_SCORE = 5;

export const SEAL_SCORE_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Below expectations",
  3: "Meets",
  4: "Good",
  5: "Excellent",
};

export function getScoreLabel(score: number): string | undefined {
  return SEAL_SCORE_LABELS[score];
}

export function formatScoreRange(minScore: number, maxScore: number): string {
  return `${minScore}–${maxScore}`;
}
