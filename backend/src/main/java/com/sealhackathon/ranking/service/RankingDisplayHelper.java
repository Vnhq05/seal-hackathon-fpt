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

        List<RankingResponse> sorted = rankings.stream()
                .sorted(Comparator
                        .comparing(RankingResponse::getFinalScore,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(RankingResponse::getRank, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        List<RankingResponse> result = new ArrayList<>(sorted.size());
        for (int i = 0; i < sorted.size(); i++) {
            RankingResponse current = sorted.get(i);
            int rank = computeDisplayRank(i, sorted, result);
            result.add(copyRanking(current, rank));
        }
        return result;
    }

    public static List<LiveScoreEntry> reRankLiveScoreWithinTrack(List<LiveScoreEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            return List.of();
        }

        List<LiveScoreEntry> sorted = entries.stream()
                .sorted(Comparator
                        .comparing(LiveScoreEntry::getFinalScore,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(LiveScoreEntry::getRank, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        List<LiveScoreEntry> result = new ArrayList<>(sorted.size());
        for (int i = 0; i < sorted.size(); i++) {
            LiveScoreEntry current = sorted.get(i);
            int rank = computeLiveScoreDisplayRank(i, sorted, result);
            result.add(copyLiveScoreEntry(current, rank));
        }
        return result;
    }

    private static int computeDisplayRank(int index, List<RankingResponse> sorted, List<RankingResponse> result) {
        if (index == 0) {
            return 1;
        }
        RankingResponse current = sorted.get(index);
        RankingResponse previous = sorted.get(index - 1);
        if (current.getFinalScore() != null && previous.getFinalScore() != null
                && current.getFinalScore().compareTo(previous.getFinalScore()) == 0) {
            return result.get(index - 1).getRank();
        }
        return index + 1;
    }

    private static int computeLiveScoreDisplayRank(int index, List<LiveScoreEntry> sorted,
                                                   List<LiveScoreEntry> result) {
        if (index == 0) {
            return 1;
        }
        LiveScoreEntry current = sorted.get(index);
        LiveScoreEntry previous = sorted.get(index - 1);
        if (current.getFinalScore() != null && previous.getFinalScore() != null
                && current.getFinalScore().compareTo(previous.getFinalScore()) == 0) {
            return result.get(index - 1).getRank();
        }
        return index + 1;
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
