import type { CompetitionFormat } from "./types";
import type { RoundResponse } from "./round.api";

export function formatAdvancementLabel(
  round: RoundResponse,
  competitionFormat?: CompetitionFormat | null,
): string {
  if (round.roundType === "FINAL" || round.advancementRule === "FINALIST_POOL") {
    return "Final · reuses previous submission";
  }
  if (round.advancementRule === "PER_GROUP_TOP_N") {
    return "Auto advance per competition group";
  }
  if (
    competitionFormat === "SEAL_RAG_2026"
    || round.advancementRule === "PER_TRACK_TOP_N"
    || round.roundType === "PRELIMINARY"
  ) {
    return "Auto advance per group/track";
  }
  return "Auto advance from team count";
}
