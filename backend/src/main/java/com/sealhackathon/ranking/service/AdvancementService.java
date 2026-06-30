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

    @Transactional
    public List<AdvancementResponse> determineAdvancements(UUID roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));

        AdvancementRule rule = round.getAdvancementRule() != null
                ? round.getAdvancementRule()
                : AdvancementRule.GLOBAL_TOP_N;

        int latestVersion = rankingRepository.findMaxVersionByRoundId(roundId);
        List<Ranking> rankings = rankingRepository
                .findByRoundIdAndVersionOrderByRankAsc(roundId, latestVersion);

        advancementRepository.deleteByRoundId(roundId);
        advancementRepository.flush();

        Set<UUID> advancedTeamIds = switch (rule) {
            case PER_TRACK_TOP_N -> determinePerTrackAdvanced(round, rankings);
            case FINALIST_POOL, NONE -> Set.of();
            case GLOBAL_TOP_N -> determineGlobalAdvanced(round.getAdvancementCutoff(), rankings);
        };

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

    private Set<UUID> determineGlobalAdvanced(int cutoff, List<Ranking> rankings) {
        Set<UUID> advanced = new HashSet<>();
        for (Ranking r : rankings) {
            if (r.getRank() <= cutoff) {
                advanced.add(r.getTeamId());
            }
        }
        return advanced;
    }

    private Set<UUID> determinePerTrackAdvanced(Round round, List<Ranking> rankings) {
        int cutoff = round.getAdvancementCutoff() != null
                ? round.getAdvancementCutoff()
                : formatRuleEngine.getSealTopPerTrack();
        Map<UUID, List<Ranking>> byTrack = new LinkedHashMap<>();

        for (Ranking r : rankings) {
            UUID trackId = teamPublicService.getTeam(r.getTeamId())
                    .map(TeamSnapshot::getTrackId)
                    .orElse(null);
            if (trackId == null) {
                continue;
            }
            byTrack.computeIfAbsent(trackId, k -> new ArrayList<>()).add(r);
        }

        Set<UUID> advanced = new HashSet<>();
        for (List<Ranking> trackRankings : byTrack.values()) {
            trackRankings.sort(Comparator
                    .comparing(Ranking::getRank)
                    .thenComparing(Ranking::getFinalScore, Comparator.reverseOrder()));
            int take = Math.min(cutoff, trackRankings.size());
            for (int i = 0; i < take; i++) {
                advanced.add(trackRankings.get(i).getTeamId());
            }
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
