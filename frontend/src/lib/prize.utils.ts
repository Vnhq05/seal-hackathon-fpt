import type { PrizeRank, PrizeRequest } from "@/lib/api/event.api";

type PrizeOrderingInput = Pick<PrizeRequest, "rank" | "value" | "trackIndex">;

export const PRIZE_RANK_LABELS: Record<PrizeRank, string> = {
  FIRST: "First Prize",
  SECOND: "Second Prize",
  THIRD: "Third Prize",
  CONSOLATION: "Consolation Prize",
};

export const DEFAULT_CONSOLATION_LABEL = PRIZE_RANK_LABELS.CONSOLATION;

const PRIZE_RANK_ORDER: PrizeRank[] = ["FIRST", "SECOND", "THIRD"];

export function getPrizeLabel(rank?: PrizeRank | null, label?: string | null): string {
  if (label?.trim()) return label.trim();
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

  const money = `${new Intl.NumberFormat("en-US").format(amount)} ₫`;
  return rest ? `${money} ${rest}` : money;
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
