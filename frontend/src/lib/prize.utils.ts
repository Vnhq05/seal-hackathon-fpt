import type { PrizeAssignmentMode, PrizeRank, PrizeRequest } from "@/lib/api/event.api";

type PrizeOrderingInput = Pick<PrizeRequest, "rank" | "value" | "trackIndex">;

export const PRIZE_RANK_LABELS: Record<PrizeRank, string> = {
  FIRST: "First Prize",
  SECOND: "Second Prize",
  THIRD: "Third Prize",
  CONSOLATION: "Consolation Prize",
};

export const DEFAULT_CONSOLATION_LABEL = PRIZE_RANK_LABELS.CONSOLATION;

/** Legacy admin textarea blob stored as a single CONSOLATION row. */
export const FREE_TEXT_PRIZE_LABEL = "Prizes";

const PRIZE_RANK_ORDER: PrizeRank[] = ["FIRST", "SECOND", "THIRD"];

export function isLegacyFreeTextPrize(p: Pick<PrizeOrderingInput, "rank"> & { label?: string | null }): boolean {
  return p.rank === "CONSOLATION" && p.label === FREE_TEXT_PRIZE_LABEL;
}

export function resolveAssignmentMode(
  rank: PrizeRank,
  mode?: PrizeAssignmentMode | null,
): PrizeAssignmentMode {
  if (rank === "FIRST" || rank === "SECOND" || rank === "THIRD") return "RANK_BASED";
  return mode === "MANUAL" ? "MANUAL" : "RANK_BASED";
}

export function getPrizeLabel(rank: PrizeRank, label?: string | null): string {
  if (label?.trim() && label.trim() !== FREE_TEXT_PRIZE_LABEL) return label.trim();
  return PRIZE_RANK_LABELS[rank];
}

/** Strip non-digits and parse prize amount (mirrors backend PrizeAmountUtils). */
export function parsePrizeAmount(value: string): number | null {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

export function formatPrizeAmount(value: string): string {
  const amount = parsePrizeAmount(value);
  if (amount == null) return value;
  return `${new Intl.NumberFormat("en-US").format(amount)} VND`;
}

type AwardOrderPrize = {
  rank: PrizeRank;
  label?: string | null;
  value: string;
  assignmentMode?: PrizeAssignmentMode | null;
};

/** Rank-based prizes only (First/Second/Third + Encouragement). */
export function orderRankBasedPrizes<T extends AwardOrderPrize>(prizes: T[]): T[] {
  const ordered: T[] = [];
  for (const rank of PRIZE_RANK_ORDER) {
    const match = prizes.find((p) => p.rank === rank);
    if (match && parsePrizeAmount(match.value) != null) ordered.push(match);
  }
  for (const prize of prizes) {
    if (prize.rank !== "CONSOLATION" || isLegacyFreeTextPrize(prize)) continue;
    if (resolveAssignmentMode(prize.rank, prize.assignmentMode) !== "RANK_BASED") continue;
    if (parsePrizeAmount(prize.value) == null) continue;
    ordered.push(prize);
  }
  return ordered;
}

/** Special prizes that require manual team selection. */
export function orderManualPrizes<T extends AwardOrderPrize>(prizes: T[]): T[] {
  return prizes.filter((prize) => {
    if (prize.rank !== "CONSOLATION" || isLegacyFreeTextPrize(prize)) return false;
    if (resolveAssignmentMode(prize.rank, prize.assignmentMode) !== "MANUAL") return false;
    return parsePrizeAmount(prize.value) != null;
  });
}

/** Combined preview order: rank-based first, then manual. */
export function orderPrizesForAward<T extends AwardOrderPrize>(prizes: T[]): T[] {
  return [...orderRankBasedPrizes(prizes), ...orderManualPrizes(prizes)];
}

export function validatePrizeOrdering(prizes: PrizeOrderingInput[]): string | null {
  const groups = new Map<string, PrizeOrderingInput[]>();
  for (const p of prizes) {
    const key = p.trackIndex != null ? `track-${p.trackIndex}` : "shared";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  for (const [key, group] of groups) {
    const byRank = new Map<PrizeRank, number>();
    for (const p of group) {
      const amount = parsePrizeAmount(p.value);
      if (amount == null) continue;
      if (p.rank !== "CONSOLATION") {
        byRank.set(p.rank, amount);
      }
    }

    for (let i = 0; i < PRIZE_RANK_ORDER.length - 1; i++) {
      const higher = PRIZE_RANK_ORDER[i];
      const lower = PRIZE_RANK_ORDER[i + 1];
      if (
        byRank.has(higher) &&
        byRank.has(lower) &&
        byRank.get(higher)! <= byRank.get(lower)!
      ) {
        const scope = key === "shared" ? "" : ` (track ${Number(key.replace("track-", "")) + 1})`;
        return `${PRIZE_RANK_LABELS[higher]} must be greater than ${PRIZE_RANK_LABELS[lower]}${scope}`;
      }
    }
  }
  return null;
}
