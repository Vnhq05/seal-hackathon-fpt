package com.sealhackathon.ranking.service;

import com.sealhackathon.ranking.dto.response.LiveScoreEntry;
import com.sealhackathon.ranking.dto.response.RankingResponse;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Display-layer ranking adjustments (stored rankings remain global per round).
 */
public final class RankingDisplayHelper {

    private RankingDisplayHelper() {
    }

    public static List<RankingResponse> reRankWithinTrack(List<RankingResponse> rankings) {
        if (rankings == null || rankings.isEmpty()) {
            return List.of();
        }

        // Prefer stored rank (already full-tiebreak ordered); dense 1..n within track.
        List<RankingResponse> sorted = rankings.stream()
                .sorted(Comparator
                        .comparing(RankingResponse::getRank, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(RankingResponse::getFinalScore,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<RankingResponse> result = new ArrayList<>(sorted.size());
        for (int i = 0; i < sorted.size(); i++) {
            result.add(copyRanking(sorted.get(i), i + 1));
        }
        return result;
    }

    public static List<LiveScoreEntry> reRankLiveScoreWithinTrack(List<LiveScoreEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            return List.of();
        }

        List<LiveScoreEntry> sorted = entries.stream()
                .sorted(Comparator
                        .comparing(LiveScoreEntry::getRank, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(LiveScoreEntry::getFinalScore,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<LiveScoreEntry> result = new ArrayList<>(sorted.size());
        for (int i = 0; i < sorted.size(); i++) {
            result.add(copyLiveScoreEntry(sorted.get(i), i + 1));
        }
        return result;
    }

    private static RankingResponse copyRanking(RankingResponse source, int rank) {
        return RankingResponse.builder()
                .id(source.getId())
                .teamId(source.getTeamId())
                .teamName(source.getTeamName())
                .roundId(source.getRoundId())
                .roundName(source.getRoundName())
                .trackId(source.getTrackId())
                .trackName(source.getTrackName())
                .finalScore(source.getFinalScore())
                .rank(rank)
                .version(source.getVersion())
                .calculatedAt(source.getCalculatedAt())
                .build();
    }

    private static LiveScoreEntry copyLiveScoreEntry(LiveScoreEntry source, int rank) {
        return LiveScoreEntry.builder()
                .teamId(source.getTeamId())
                .teamName(source.getTeamName())
                .trackName(source.getTrackName())
                .trackId(source.getTrackId())
                .finalScore(source.getFinalScore())
                .rank(rank)
                .previousRank(source.getPreviousRank())
                .scoreStatus(source.getScoreStatus())
                .judgesScored(source.getJudgesScored())
                .judgesAssigned(source.getJudgesAssigned())
                .calculatedAt(source.getCalculatedAt())
                .build();
    }
}
