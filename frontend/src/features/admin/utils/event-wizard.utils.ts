export {
  DEFAULT_CONSOLATION_LABEL,
  getPrizeLabel,
  parsePrizeAmount,
  parsePrizeAmount as parsePrizeValue,
  PRIZE_RANK_LABELS,
  validatePrizeOrdering,
} from "@/lib/prize.utils";

export interface WizardRound {
  name: string;
  startDate: string;
  endDate: string;
  judgeUserIds: string[];
  advancementCutoff: number;
  roundWeight: number;
}

export interface RoundDraft {
  name: string;
  startDate: string;
  endDate: string;
  advancementCutoff: number;
  roundWeight: number;
}

function parseIsoDate(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

function formatIsoDate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const { year, month, day } = parseIsoDate(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return formatIsoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function getEventEndDate(startDate: string, duration: number): string {
  return addDays(startDate, duration - 1);
}

export function getInclusiveDayCount(startDate: string, endDate: string): number {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const startMs = Date.UTC(start.year, start.month - 1, start.day);
  const endMs = Date.UTC(end.year, end.month - 1, end.day);
  return Math.floor((endMs - startMs) / 86_400_000) + 1;
}

export function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const { year, month, day } = parseIsoDate(iso);
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return `${dd}/${mm}/${year}`;
}

export function getRoundWeightTotal(rounds: Pick<RoundDraft, "roundWeight">[]): number {
  return rounds.reduce((sum, r) => sum + (r.roundWeight ?? 0), 0);
}

export function isRoundWeightValid(rounds: Pick<RoundDraft, "roundWeight">[]): boolean {
  if (rounds.length <= 1) return true;
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

export function formatRoundDateTime(dt: string): string {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRoundWarnings(
  round: RoundDraft,
  eventStart: string,
  eventEnd: string,
  prevRound: RoundDraft | null,
): string[] {
  const warnings: string[] = [];
  if (!eventStart || !eventEnd) return warnings;

  const eventStartDt = eventStart + "T00:00:00";
  const eventEndDt = eventEnd + "T23:59:59";

  if (round.startDate && round.startDate < eventStartDt) {
    warnings.push("Round start is before the event start date");
  }
  if (round.endDate && round.endDate > eventEndDt) {
    warnings.push("Round end is after the event end date");
  }
  if (round.startDate && round.endDate && round.startDate >= round.endDate) {
    warnings.push("Round end must be after round start");
  }
  if (prevRound && prevRound.endDate && round.startDate && round.startDate <= prevRound.endDate) {
    warnings.push(`Must start after previous round "${prevRound.name}" ends`);
  }

  return warnings;
}
