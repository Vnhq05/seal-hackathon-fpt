package com.sealhackathon.ranking.service;

import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.AdvancementRule;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.ranking.domain.Advancement;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.domain.enums.AdvancementStatus;
import com.sealhackathon.ranking.dto.response.AdvancementResponse;
import com.sealhackathon.ranking.repository.AdvancementRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdvancementService {

    private final AdvancementRepository advancementRepository;
    private final RankingRepository rankingRepository;
    private final RoundRepository roundRepository;
    private final TeamPublicService teamPublicService;
    private final FormatRuleEngine formatRuleEngine;
    private final AdvancementCutoffCalculator cutoffCalculator;

    @Transactional
    public List<AdvancementResponse> determineAdvancements(UUID roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));

        AdvancementRule rule = resolveEffectiveRule(round);

        int latestVersion = rankingRepository.findMaxVersionByRoundId(roundId);
        List<Ranking> rankings = rankingRepository
                .findByRoundIdAndVersionOrderByRankAsc(roundId, latestVersion);

        advancementRepository.deleteByRoundId(roundId);
        advancementRepository.flush();

        Set<UUID> advancedTeamIds = switch (rule) {
            case PER_GROUP_TOP_N -> determinePerGroupAdvanced(rankings);
            case PER_TRACK_TOP_N -> determinePerTrackAdvanced(rankings);
            case FINALIST_POOL, NONE -> Set.of();
            case GLOBAL_TOP_N -> determineGlobalAdvanced(rankings);
        };

        // Persist computed cutoff for audit when auto mode is on
        if (cutoffCalculator.isAutoEnabled()
                && rule != AdvancementRule.FINALIST_POOL
                && rule != AdvancementRule.NONE) {
            int computed = advancedTeamIds.size();
            if (computed > 0) {
                round.setAdvancementCutoff(Math.max(1, computed));
                roundRepository.save(round);
            }
        }

        List<Advancement> advancements = new ArrayList<>();
        for (Ranking r : rankings) {
            AdvancementStatus status = advancedTeamIds.contains(r.getTeamId())
                    ? AdvancementStatus.ADVANCED
                    : AdvancementStatus.ELIMINATED;
            advancements.add(Advancement.builder()
                    .teamId(r.getTeamId())
                    .roundId(roundId)
                    .status(status)
                    .build());
        }

        advancements = advancementRepository.saveAll(advancements);

        Map<UUID, Ranking> rankingMap = rankings.stream()
                .collect(Collectors.toMap(Ranking::getTeamId, r -> r));

        return advancements.stream()
                .map(a -> toResponse(a, rankingMap.get(a.getTeamId())))
                .toList();
    }

    private AdvancementRule resolveEffectiveRule(Round round) {
        AdvancementRule rule = round.getAdvancementRule() != null
                ? round.getAdvancementRule()
                : AdvancementRule.GLOBAL_TOP_N;
        if (rule == AdvancementRule.FINALIST_POOL || rule == AdvancementRule.NONE) {
            return rule;
        }
        // Prefer per-group when any ranked team is in a competition group
        return rule;
    }

    private Set<UUID> determineGlobalAdvanced(List<Ranking> rankings) {
        int cutoff = cutoffCalculator.isAutoEnabled()
                ? cutoffCalculator.compute(rankings.size())
                : rankings.isEmpty() ? 0 : Math.min(rankings.size(), Math.max(1, rankings.size()));
        Set<UUID> advanced = new HashSet<>();
        for (Ranking r : rankings) {
            if (r.getRank() <= cutoff) {
                advanced.add(r.getTeamId());
            }
        }
        return advanced;
    }

    private Set<UUID> determinePerTrackAdvanced(List<Ranking> rankings) {
        Map<UUID, List<Ranking>> byTrack = new LinkedHashMap<>();
        List<Ranking> untracked = new ArrayList<>();

        for (Ranking r : rankings) {
            UUID trackId = teamPublicService.getTeam(r.getTeamId())
                    .map(TeamSnapshot::getTrackId)
                    .orElse(null);
            if (trackId == null) {
                untracked.add(r);
                continue;
            }
            byTrack.computeIfAbsent(trackId, k -> new ArrayList<>()).add(r);
        }

        Set<UUID> advanced = takeTopFromBuckets(byTrack);
        if (!untracked.isEmpty()) {
            advanced.addAll(takeTopFromList(untracked));
        }
        return advanced;
    }

    private Set<UUID> determinePerGroupAdvanced(List<Ranking> rankings) {
        Map<UUID, List<Ranking>> byGroup = new LinkedHashMap<>();
        List<Ranking> withoutGroup = new ArrayList<>();

        for (Ranking r : rankings) {
            UUID groupId = teamPublicService.getTeam(r.getTeamId())
                    .map(TeamSnapshot::getGroupId)
                    .orElse(null);
            if (groupId == null) {
                withoutGroup.add(r);
                continue;
            }
            byGroup.computeIfAbsent(groupId, k -> new ArrayList<>()).add(r);
        }

        if (byGroup.isEmpty()) {
            // No groups yet — fall back to per-track then global
            return determinePerTrackAdvanced(rankings);
        }

        Set<UUID> advanced = takeTopFromBuckets(byGroup);
        if (!withoutGroup.isEmpty()) {
            // Ungrouped teams: treat as one bucket so they are not ignored
            advanced.addAll(takeTopFromList(withoutGroup));
        }
        return advanced;
    }

    private Set<UUID> takeTopFromBuckets(Map<UUID, List<Ranking>> buckets) {
        Set<UUID> advanced = new HashSet<>();
        for (List<Ranking> bucket : buckets.values()) {
            advanced.addAll(takeTopFromList(bucket));
        }
        return advanced;
    }

    private Set<UUID> takeTopFromList(List<Ranking> list) {
        List<Ranking> sorted = new ArrayList<>(list);
        sorted.sort(Comparator
                .comparing(Ranking::getRank)
                .thenComparing(Ranking::getFinalScore, Comparator.reverseOrder()));
        int cutoff = cutoffCalculator.isAutoEnabled()
                ? cutoffCalculator.compute(sorted.size())
                : Math.min(sorted.size(), formatRuleEngine.getSealTopPerTrack());
        Set<UUID> advanced = new HashSet<>();
        for (int i = 0; i < Math.min(cutoff, sorted.size()); i++) {
            advanced.add(sorted.get(i).getTeamId());
        }
        return advanced;
    }

    @Transactional(readOnly = true)
    public List<AdvancementResponse> getAdvancements(UUID roundId) {
        int latestVersion = rankingRepository.findMaxVersionByRoundId(roundId);
        Map<UUID, Ranking> rankingMap = rankingRepository
                .findByRoundIdAndVersionOrderByRankAsc(roundId, latestVersion).stream()
                .collect(Collectors.toMap(Ranking::getTeamId, r -> r));

        return advancementRepository.findByRoundId(roundId).stream()
                .map(a -> toResponse(a, rankingMap.get(a.getTeamId())))
                .toList();
    }

    private AdvancementResponse toResponse(Advancement a, Ranking ranking) {
        TeamSnapshot team = teamPublicService.getTeam(a.getTeamId()).orElse(null);

        return AdvancementResponse.builder()
                .id(a.getId())
                .teamId(a.getTeamId())
                .teamName(team != null ? team.getName() : null)
                .roundId(a.getRoundId())
                .status(a.getStatus())
                .rank(ranking != null ? ranking.getRank() : null)
                .finalScore(ranking != null ? ranking.getFinalScore() : null)
                .build();
    }
}
