package com.sealhackathon.ranking.service;

import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TieBreakComparatorBuilder {

    private final ScoringTemplateRepository scoringTemplateRepository;

    public List<CriteriaSnapshot> resolveCriteriaOrder(
            List<CriteriaSnapshot> roundCriteria,
            UUID scoringTemplateId,
            List<UUID> tiebreakerCriterionIds,
            String legacyTiebreakerCriteria) {

        if (tiebreakerCriterionIds != null && !tiebreakerCriterionIds.isEmpty()) {
            return orderByTemplateCriterionIds(roundCriteria, scoringTemplateId, tiebreakerCriterionIds);
        }
        if (legacyTiebreakerCriteria != null && !legacyTiebreakerCriteria.isBlank()) {
            return orderByCriterionNames(roundCriteria, legacyTiebreakerCriteria);
        }
        return roundCriteria.stream()
                .sorted(Comparator.comparingInt(CriteriaSnapshot::getSortOrder))
                .toList();
    }

    public <T> Comparator<T> buildComparator(
            Comparator<T> scoreComparator,
            List<CriteriaSnapshot> orderedCriteria,
            Function<T, Map<UUID, BigDecimal>> criteriaAveragesFn,
            Function<T, BigDecimal> deviationFn,
            Function<T, LocalDateTime> submittedAtFn) {

        Comparator<T> comp = scoreComparator;
        for (CriteriaSnapshot c : orderedCriteria) {
            comp = comp.thenComparing(
                    t -> criteriaAveragesFn.apply(t).getOrDefault(c.getId(), BigDecimal.ZERO),
                    Comparator.reverseOrder());
        }
        comp = comp.thenComparing(deviationFn);
        comp = comp.thenComparing(submittedAtFn);
        return comp;
    }

    private List<CriteriaSnapshot> orderByTemplateCriterionIds(
            List<CriteriaSnapshot> roundCriteria,
            UUID scoringTemplateId,
            List<UUID> tiebreakerCriterionIds) {

        if (scoringTemplateId == null) {
            return orderBySortOrder(roundCriteria);
        }

        ScoringTemplate template = scoringTemplateRepository.findById(scoringTemplateId).orElse(null);
        if (template == null || template.getCriteria().isEmpty()) {
            return orderBySortOrder(roundCriteria);
        }

        Map<UUID, String> templateIdToName = template.getCriteria().stream()
                .collect(Collectors.toMap(ScoringTemplateCriterion::getId, ScoringTemplateCriterion::getName));

        Map<String, CriteriaSnapshot> roundByName = new HashMap<>();
        for (CriteriaSnapshot c : roundCriteria) {
            roundByName.putIfAbsent(c.getName().toLowerCase(), c);
        }

        List<CriteriaSnapshot> ordered = new ArrayList<>();
        Set<UUID> usedRoundIds = new HashSet<>();

        for (UUID templateCriterionId : tiebreakerCriterionIds) {
            String name = templateIdToName.get(templateCriterionId);
            if (name == null) {
                continue;
            }
            CriteriaSnapshot roundCriterion = roundByName.get(name.toLowerCase());
            if (roundCriterion != null && usedRoundIds.add(roundCriterion.getId())) {
                ordered.add(roundCriterion);
            }
        }

        roundCriteria.stream()
                .filter(c -> !usedRoundIds.contains(c.getId()))
                .sorted(Comparator.comparingInt(CriteriaSnapshot::getSortOrder))
                .forEach(ordered::add);

        return ordered;
    }

    private List<CriteriaSnapshot> orderByCriterionNames(
            List<CriteriaSnapshot> roundCriteria,
            String tiebreakerCriteria) {

        List<String> order = Arrays.stream(tiebreakerCriteria.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        Map<String, Integer> nameOrder = new HashMap<>();
        for (int i = 0; i < order.size(); i++) {
            nameOrder.put(order.get(i).toLowerCase(), i);
        }

        return roundCriteria.stream()
                .sorted(Comparator.comparingInt(c ->
                        nameOrder.getOrDefault(c.getName().toLowerCase(), Integer.MAX_VALUE)))
                .toList();
    }

    private List<CriteriaSnapshot> orderBySortOrder(List<CriteriaSnapshot> roundCriteria) {
        return roundCriteria.stream()
                .sorted(Comparator.comparingInt(CriteriaSnapshot::getSortOrder))
                .toList();
    }
}
