import type { AdvancementResponse, EventRankingBoard } from "@/lib/api/ranking.api";
import type {
  LeaderboardTeam,
  LeaderboardTeamStatus,
} from "@/features/rankings/types/leaderboard.types";

function mapAdvancementStatus(
  teamId: string,
  advancements?: AdvancementResponse[],
): LeaderboardTeamStatus {
  if (!advancements || advancements.length === 0) {
    return "active";
  }
  const advancement = advancements.find((a) => a.teamId === teamId);
  if (!advancement) {
    return "active";
  }
  return advancement.status === "ADVANCED" ? "finalist" : "eliminated";
}

export function mapEventBoardToLeaderboardTeams(
  board: EventRankingBoard,
  advancements?: AdvancementResponse[],
  currentTeamId?: string,
): LeaderboardTeam[] {
  return board.rankings.map((entry) => ({
    id: entry.id,
    teamId: entry.teamId,
    rank: entry.rank,
    name: entry.teamName ?? entry.teamId,
    trackId: entry.trackId,
    trackName: entry.trackName ?? "—",
    roundScores: [
      {
        roundId: entry.roundId,
        roundName: entry.roundName ?? board.roundName,
        roundType: board.roundType ?? null,
        score: Number(entry.finalScore),
      },
    ],
    totalScore: Number(entry.finalScore),
    status: mapAdvancementStatus(entry.teamId, advancements),
    rankChange: 0,
    isCurrentUserTeam: currentTeamId != null && entry.teamId === currentTeamId,
  }));
}

export function findMyTeamSummary(
  teams: LeaderboardTeam[],
): LeaderboardTeam | undefined {
  return teams.find((team) => team.isCurrentUserTeam);
}
