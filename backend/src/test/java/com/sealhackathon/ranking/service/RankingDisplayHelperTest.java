package com.sealhackathon.ranking.service;

import com.sealhackathon.ranking.dto.response.RankingResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class RankingDisplayHelperTest {

    @Test
    void reRankWithinTrack_assignsSequentialRanksByScore() {
        UUID trackId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();

        List<RankingResponse> globalRankings = List.of(
                ranking(UUID.randomUUID(), roundId, trackId, 90, 1),
                ranking(UUID.randomUUID(), roundId, trackId, 85, 3),
                ranking(UUID.randomUUID(), roundId, trackId, 80, 5));

        List<RankingResponse> reRanked = RankingDisplayHelper.reRankWithinTrack(globalRankings);

        assertThat(reRanked).extracting(RankingResponse::getRank).containsExactly(1, 2, 3);
        assertThat(reRanked).extracting(r -> r.getFinalScore().doubleValue())
                .containsExactly(90.0, 85.0, 80.0);
    }

    @Test
    void reRankWithinTrack_handlesTiedScores() {
        UUID trackId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();

        List<RankingResponse> globalRankings = List.of(
                ranking(UUID.randomUUID(), roundId, trackId, 90, 1),
                ranking(UUID.randomUUID(), roundId, trackId, 90, 4),
                ranking(UUID.randomUUID(), roundId, trackId, 80, 6));

        List<RankingResponse> reRanked = RankingDisplayHelper.reRankWithinTrack(globalRankings);

        assertThat(reRanked).extracting(RankingResponse::getRank).containsExactly(1, 1, 3);
    }

    private static RankingResponse ranking(UUID teamId, UUID roundId, UUID trackId,
                                           double score, int globalRank) {
        return RankingResponse.builder()
                .id(UUID.randomUUID())
                .teamId(teamId)
                .roundId(roundId)
                .trackId(trackId)
                .finalScore(BigDecimal.valueOf(score))
                .rank(globalRank)
                .version(1)
                .build();
    }
}
