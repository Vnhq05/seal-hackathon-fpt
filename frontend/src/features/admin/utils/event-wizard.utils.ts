import type { WizardRound } from "@/features/admin/store/event-wizard.store";

export {
  DEFAULT_CONSOLATION_LABEL,
  getPrizeLabel,
  parsePrizeAmount,
  parsePrizeAmount as parsePrizeValue,
  PRIZE_RANK_LABELS,
  validatePrizeOrdering,
} from "@/lib/prize.utils";

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function getEventEndDate(startDate: string, duration: number): string {
  return addDays(startDate, duration - 1);
}

export function getRoundWeightTotal(rounds: WizardRound[]): number {
  return rounds.reduce((sum, r) => sum + (r.roundWeight ?? 0), 0);
}

export function isRoundWeightValid(rounds: WizardRound[]): boolean {
  if (rounds.length === 0) return false;
  if (rounds.length === 1) return true;
  return getRoundWeightTotal(rounds) === 100;
}

export function parsePositiveInt(value: string): number | undefined {
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  const n = parseInt(digits, 10);
  return n > 0 ? n : undefined;
}

export function blockNonLetterNameInput(value: string): string {
  return value.replace(/[^a-zA-Z\s]/g, "");
}
