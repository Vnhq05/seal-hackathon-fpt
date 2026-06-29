package com.sealhackathon.ranking.service;

import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.ranking.domain.Ranking;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RankingTieBreakComparatorTest {

    @Mock private EventPublicService eventPublicService;
    @Mock private AggregationService aggregationService;
    @Mock private TieBreakComparatorBuilder tieBreakComparatorBuilder;

    @InjectMocks private RankingTieBreakComparator comparator;

    private UUID roundId;
    private UUID eventId;

    @BeforeEach
    void setUp() {
        roundId = UUID.randomUUID();
        eventId = UUID.randomUUID();
        when(eventPublicService.getRound(roundId)).thenReturn(Optional.of(
                RoundSnapshot.builder().id(roundId).eventId(eventId).build()));
        when(eventPublicService.getEvent(eventId)).thenReturn(Optional.of(
                EventSnapshot.builder().id(eventId).build()));
        when(eventPublicService.getCriteriaByRound(roundId)).thenReturn(List.of());
        when(tieBreakComparatorBuilder.resolveCriteriaOrder(any(), any(), any(), any()))
                .thenReturn(List.of());
        when(tieBreakComparatorBuilder.buildComparator(any(), any(), any(), any(), any()))
                .thenAnswer(invocation -> {
                    @SuppressWarnings("unchecked")
                    java.util.function.Function<Ranking, LocalDateTime> submittedAtFn =
                            invocation.getArgument(4);
                    return Comparator
                            .comparing(Ranking::getFinalScore, Comparator.reverseOrder())
                            .thenComparing(submittedAtFn);
                });
    }

    @Test
    void cutTopN_breaksTieBySubmittedAt() {
        UUID earlyTeam = UUID.randomUUID();
        UUID lateTeam = UUID.randomUUID();
        LocalDateTime earlyTime = LocalDateTime.of(2026, 4, 12, 9, 0);
        LocalDateTime lateTime = LocalDateTime.of(2026, 4, 12, 10, 0);

        Ranking early = ranking(earlyTeam, BigDecimal.valueOf(85));
        Ranking late = ranking(lateTeam, BigDecimal.valueOf(85));

        when(aggregationService.getTeamTieBreakMetrics(roundId, earlyTeam))
                .thenReturn(Optional.of(new AggregationService.TeamTieBreakMetrics(
                        Map.of(), BigDecimal.ZERO, earlyTime)));
        when(aggregationService.getTeamTieBreakMetrics(roundId, lateTeam))
                .thenReturn(Optional.of(new AggregationService.TeamTieBreakMetrics(
                        Map.of(), BigDecimal.ZERO, lateTime)));

        var result = comparator.cutTopN(List.of(late, early), 1, roundId);

        assertThat(result.selected()).containsExactly(early);
        assertThat(result.contested()).isEmpty();
    }

    @Test
    void cutTopN_flagsContestedWhenSameScoreAndSubmitTime() {
        UUID team1 = UUID.randomUUID();
        UUID team2 = UUID.randomUUID();
        LocalDateTime sameTime = LocalDateTime.of(2026, 4, 12, 9, 0);

        Ranking r1 = ranking(team1, BigDecimal.valueOf(85));
        Ranking r2 = ranking(team2, BigDecimal.valueOf(85));

        when(aggregationService.getTeamTieBreakMetrics(roundId, team1))
                .thenReturn(Optional.of(new AggregationService.TeamTieBreakMetrics(
                        Map.of(), BigDecimal.ZERO, sameTime)));
        when(aggregationService.getTeamTieBreakMetrics(roundId, team2))
                .thenReturn(Optional.of(new AggregationService.TeamTieBreakMetrics(
                        Map.of(), BigDecimal.ZERO, sameTime)));

        var result = comparator.cutTopN(List.of(r1, r2), 1, roundId);

        assertThat(result.selected()).isEmpty();
        assertThat(result.contested()).containsExactlyInAnyOrder(r1, r2);
    }

    private Ranking ranking(UUID teamId, BigDecimal score) {
        return Ranking.builder()
                .teamId(teamId)
                .roundId(roundId)
                .finalScore(score)
                .rank(1)
                .version(1)
                .calculatedAt(LocalDateTime.now())
                .build();
    }
}
