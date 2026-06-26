import type { PrizeRank } from "@/lib/api/event.api";
import type { WizardPrize } from "@/features/admin/store/event-wizard.store";

export const PRIZE_RANK_LABELS: Record<PrizeRank, string> = {
  FIRST: "Giải Nhất",
  SECOND: "Giải Nhì",
  THIRD: "Giải Ba",
  CONSOLATION: "Giải Khuyến khích",
};

export const DEFAULT_CONSOLATION_LABEL = PRIZE_RANK_LABELS.CONSOLATION;

const PRIZE_RANK_ORDER: PrizeRank[] = ["FIRST", "SECOND", "THIRD"];

export function getPrizeLabel(rank: PrizeRank, label?: string | null): string {
  if (label?.trim()) return label.trim();
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
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}

export function validatePrizeOrdering(prizes: WizardPrize[]): string | null {
  const groups = new Map<string, WizardPrize[]>();
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
        return `${PRIZE_RANK_LABELS[higher]} phải lớn hơn ${PRIZE_RANK_LABELS[lower]}${scope}`;
      }
    }
  }
  return null;
}
