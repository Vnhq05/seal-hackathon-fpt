package com.sealhackathon.ranking.service;

import com.sealhackathon.event.service.EventPublicService;
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
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdvancementService {

    private final AdvancementRepository advancementRepository;
    private final RankingRepository rankingRepository;
    private final EventPublicService eventPublicService;
    private final TeamPublicService teamPublicService;

    @Transactional
    public List<AdvancementResponse> determineAdvancements(UUID roundId) {
        int cutoff = eventPublicService.getAdvancementCutoff(roundId);
        int latestVersion = rankingRepository.findMaxVersionByRoundId(roundId);

        List<Ranking> rankings = rankingRepository
                .findByRoundIdAndVersionOrderByRankAsc(roundId, latestVersion);

        advancementRepository.deleteByRoundId(roundId);
        advancementRepository.flush();

        List<Advancement> advancements = new ArrayList<>();

        for (Ranking r : rankings) {
            AdvancementStatus status = r.getRank() <= cutoff
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
