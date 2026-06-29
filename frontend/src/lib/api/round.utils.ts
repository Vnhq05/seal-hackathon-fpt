import type { CompetitionFormat } from "./types";
import type { RoundResponse } from "./round.api";

export function formatAdvancementLabel(
  round: RoundResponse,
  competitionFormat?: CompetitionFormat | null,
): string {
  if (competitionFormat === "SEAL_RAG_2026") {
    if (round.roundType === "PRELIMINARY" || round.advancementRule === "PER_TRACK_TOP_N") {
      return `Top ${round.advancementCutoff} mỗi bảng → 6 đội chung kết`;
    }
    if (round.roundType === "FINAL" || round.advancementRule === "FINALIST_POOL") {
      return `${round.advancementCutoff} đội chung kết`;
    }
  }
  if (round.advancementRule === "PER_TRACK_TOP_N") {
    return `Top ${round.advancementCutoff} per track`;
  }
  return `Top ${round.advancementCutoff} teams`;
}
