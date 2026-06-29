package com.sealhackathon.ranking.service;

import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.ranking.domain.Ranking;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RankingTieBreakComparator {

    private final EventPublicService eventPublicService;
    private final AggregationService aggregationService;
    private final TieBreakComparatorBuilder tieBreakComparatorBuilder;

    public Comparator<Ranking> forRound(UUID roundId) {
        EventSnapshot event = eventPublicService.getRound(roundId)
                .flatMap(r -> eventPublicService.getEvent(r.getEventId()))
                .orElse(null);
        return forRound(roundId, event);
    }

    public Comparator<Ranking> forRound(UUID roundId, EventSnapshot event) {
        List<CriteriaSnapshot> criteria = eventPublicService.getCriteriaByRound(roundId);
        List<CriteriaSnapshot> orderedCriteria = tieBreakComparatorBuilder.resolveCriteriaOrder(
                criteria,
                event != null ? event.getScoringTemplateId() : null,
                event != null ? event.getTiebreakerCriterionIds() : null,
                event != null ? event.getTiebreakerCriteria() : null);

        Map<UUID, AggregationService.TeamTieBreakMetrics> metricsCache = new HashMap<>();

        return tieBreakComparatorBuilder.buildComparator(
                Comparator.comparing(Ranking::getFinalScore, Comparator.reverseOrder()),
                orderedCriteria,
                ranking -> metricsCache
                        .computeIfAbsent(ranking.getTeamId(),
                                teamId -> aggregationService.getTeamTieBreakMetrics(roundId, teamId)
                                        .orElse(emptyMetrics()))
                        .criteriaAverages(),
                ranking -> metricsCache
                        .computeIfAbsent(ranking.getTeamId(),
                                teamId -> aggregationService.getTeamTieBreakMetrics(roundId, teamId)
                                        .orElse(emptyMetrics()))
                        .scoreDeviation(),
                ranking -> metricsCache
                        .computeIfAbsent(ranking.getTeamId(),
                                teamId -> aggregationService.getTeamTieBreakMetrics(roundId, teamId)
                                        .orElse(emptyMetrics()))
                        .submittedAt());
    }

    public boolean areTied(UUID roundId, Ranking a, Ranking b) {
        return forRound(roundId).compare(a, b) == 0;
    }

    public SelectionCutResult cutTopN(List<Ranking> rankings, int n, UUID roundId) {
        EventSnapshot event = eventPublicService.getRound(roundId)
                .flatMap(r -> eventPublicService.getEvent(r.getEventId()))
                .orElse(null);
        return cutTopN(rankings, n, roundId, event);
    }

    public SelectionCutResult cutTopN(List<Ranking> rankings, int n, UUID roundId, EventSnapshot event) {
        if (rankings.isEmpty() || n <= 0) {
            return new SelectionCutResult(List.of(), List.of());
        }

        Comparator<Ranking> comp = forRound(roundId, event);
        List<Ranking> sorted = rankings.stream().sorted(comp).toList();

        if (sorted.size() <= n) {
            return new SelectionCutResult(sorted, List.of());
        }

        Ranking boundary = sorted.get(n - 1);
        if (comp.compare(boundary, sorted.get(n)) != 0) {
            return new SelectionCutResult(sorted.subList(0, n), List.of());
        }

        List<Ranking> selected = sorted.stream()
                .filter(r -> comp.compare(r, boundary) < 0)
                .toList();
        List<Ranking> contested = sorted.stream()
                .filter(r -> comp.compare(r, boundary) == 0)
                .toList();
        return new SelectionCutResult(selected, contested);
    }

    private AggregationService.TeamTieBreakMetrics emptyMetrics() {
        return new AggregationService.TeamTieBreakMetrics(
                Map.of(), BigDecimal.ZERO, LocalDateTime.MAX);
    }

    public record SelectionCutResult(List<Ranking> selected, List<Ranking> contested) {}
}
