import type { CompetitionFormat } from "./types";
import type { RoundResponse } from "./round.api";

export function formatAdvancementLabel(
  round: RoundResponse,
  competitionFormat?: CompetitionFormat | null,
): string {
  if (competitionFormat === "SEAL_RAG_2026") {
    if (round.roundType === "PRELIMINARY" || round.advancementRule === "PER_TRACK_TOP_N") {
      return `Top ${round.advancementCutoff} per track → 6 finalists`;
    }
    if (round.roundType === "FINAL" || round.advancementRule === "FINALIST_POOL") {
      return `${round.advancementCutoff} finalists`;
    }
  }
  if (round.advancementRule === "PER_TRACK_TOP_N") {
    return `Top ${round.advancementCutoff} per track`;
  }
  return `Top ${round.advancementCutoff} teams`;
}
