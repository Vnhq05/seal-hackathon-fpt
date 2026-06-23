import { useQuery } from "@tanstack/react-query";
import { roundApi, rankingApi } from "@/lib/api";

export type PastOutcome = "Champion" | "Finalist" | "Eliminated";

export interface PastComputed {
  loading: boolean;
  finalRank: number | null;
  outcome: PastOutcome | null;
  roundScores: { round: string; score: string }[];
}

async function fetchPastScores(eventId: string, teamId: string): Promise<PastComputed> {
  const rounds = await roundApi.list(eventId);

  const rankingsPerRound = await Promise.all(
    rounds.map((r) => rankingApi.getRankings(r.id).catch(() => [])),
  );

  const roundScores = rounds.map((r, i) => {
    const row = rankingsPerRound[i].find((x) => x.teamId === teamId);
    return {
      round: r.name,
      score: row ? String(Number(row.finalScore.toFixed(2))) : "—",
    };
  });

  let finalRank: number | null = null;
  let outcome: PastOutcome | null = null;

  if (rankingsPerRound.length > 0) {
    const lastRanking = rankingsPerRound[rankingsPerRound.length - 1];
    const idx = lastRanking.findIndex((x) => x.teamId === teamId);
    if (idx >= 0) {
      finalRank = idx + 1;
      outcome = idx === 0 ? "Champion" : "Finalist";
    } else {
      for (let i = rankingsPerRound.length - 2; i >= 0; i--) {
        const ii = rankingsPerRound[i].findIndex((x) => x.teamId === teamId);
        if (ii >= 0) { finalRank = ii + 1; break; }
      }
      outcome = "Eliminated";
    }
  }

  return { loading: false, finalRank, outcome, roundScores };
}

export function useTeamRoundScores(eventId: string | undefined, teamId: string | undefined) {
  return useQuery({
    queryKey: ["team-round-scores", eventId, teamId],
    queryFn: () => fetchPastScores(eventId!, teamId!),
    enabled: !!eventId && !!teamId,
  });
}
