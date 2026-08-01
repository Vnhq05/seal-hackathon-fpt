import type { PrizeAssignmentMode, PrizeRank, PrizeRequest } from "@/lib/api/event.api";

type PrizeOrderingInput = Pick<PrizeRequest, "rank" | "value" | "trackIndex" | "assignmentMode" | "label">;

export const PRIZE_RANK_LABELS: Record<PrizeRank, string> = {
  FIRST: "First Prize",
  SECOND: "Second Prize",
  THIRD: "Third Prize",
  CONSOLATION: "Encouragement Prize",
  OTHER: "Special Prize",
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

export function getPrizeLabel(rank?: PrizeRank | null, label?: string | null): string {
  if (label?.trim() && label.trim() !== FREE_TEXT_PRIZE_LABEL) return label.trim();
  if (!rank) return "Team Award";
  return PRIZE_RANK_LABELS[rank] ?? "Team Award";
}

/** Strip non-digits and parse prize amount (mirrors backend PrizeAmountUtils). */
export function parsePrizeAmount(value: string): number | null {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
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

/** Leading cash amount + optional currency token, e.g. "10,000,000 VND + Trophy". */
const LEADING_AMOUNT_PATTERN = /^(\d[\d.,\s]*\d|\d)\s*(vn[dđ]|đ|₫)?\s*/i;

/**
 * Prize values are free-form text in the DB ("7000000", "10,000,000 VND + Trophy",
 * "Trip to Singapore"), so never coerce them with Number(). Formats the leading cash
 * amount when there is one and keeps the rest of the description intact.
 */
export function formatPrizeAmount(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "";

  const match = LEADING_AMOUNT_PATTERN.exec(raw);
  if (!match) return raw;

  const amount = parsePrizeAmount(match[1]);
  if (amount == null) return raw;

  const hasCurrencyToken = Boolean(match[2]);
  const rest = raw.slice(match[0].length).trim();
  // "2 laptops" is a quantity, not a cash prize.
  if (rest && !hasCurrencyToken && amount < 1000) return raw;

  const money = `${new Intl.NumberFormat("en-US").format(amount)} VND`;
  return rest ? `${money} ${rest}` : money;
}

export function validateStructuredPrizes(prizes: PrizeOrderingInput[]): string | null {
  const first = prizes.find((p) => p.rank === "FIRST");
  const second = prizes.find((p) => p.rank === "SECOND");
  const third = prizes.find((p) => p.rank === "THIRD");
  if (!first || !second || !third) {
    return "First, Second, and Third prizes are required";
  }

  for (const p of prizes) {
    const amount = parsePrizeAmount(p.value);
    if (amount == null || amount <= 0) {
      return "Prize amount must be a positive number (VND)";
    }
    if (p.rank === "OTHER" && !p.label?.trim()) {
      return "Other (manual) prizes require a name";
    }
  }

  return validatePrizeOrdering(prizes);
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
      if (p.rank === "FIRST" || p.rank === "SECOND" || p.rank === "THIRD") {
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
