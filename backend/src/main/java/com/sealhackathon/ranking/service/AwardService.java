package com.sealhackathon.ranking.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.Prize;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.PrizeRank;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.PrizeRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.domain.TeamAward;
import com.sealhackathon.ranking.dto.response.TeamAwardResponse;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.ranking.repository.TeamAwardRepository;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AwardService {

    private static final List<PrizeRank> AWARD_ORDER = List.of(
            PrizeRank.FIRST, PrizeRank.SECOND, PrizeRank.THIRD, PrizeRank.CONSOLATION);

    private final TeamAwardRepository teamAwardRepository;
    private final RankingRepository rankingRepository;
    private final RoundRepository roundRepository;
    private final HackathonEventRepository eventRepository;
    private final PrizeRepository prizeRepository;
    private final TeamPublicService teamPublicService;

    @Transactional
    public List<TeamAwardResponse> assignAwardsFromFinalRanking(UUID eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        Round finalRound = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId).stream()
                .filter(r -> r.getRoundType() == RoundType.FINAL)
                .findFirst()
                .orElseGet(() -> {
                    List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId);
                    if (rounds.isEmpty()) {
                        throw new BusinessException("No rounds configured", HttpStatus.BAD_REQUEST);
                    }
                    return rounds.get(rounds.size() - 1);
                });

        int latestVersion = rankingRepository.findMaxVersionByRoundId(finalRound.getId());
        if (latestVersion == 0) {
            throw new BusinessException("Final rankings not yet calculated", HttpStatus.BAD_REQUEST);
        }

        List<Ranking> rankings = rankingRepository
                .findByRoundIdAndVersionOrderByRankAsc(finalRound.getId(), latestVersion);

        List<Prize> prizes = prizeRepository.findByHackathonEventId(eventId);
        Map<PrizeRank, Prize> prizeByRank = prizes.stream()
                .collect(Collectors.toMap(Prize::getRank, Function.identity(), (a, b) -> a));

        teamAwardRepository.deleteByEventId(eventId);
        teamAwardRepository.flush();

        List<TeamAwardResponse> results = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < Math.min(AWARD_ORDER.size(), rankings.size()); i++) {
            PrizeRank rank = AWARD_ORDER.get(i);
            Prize prize = prizeByRank.get(rank);
            if (prize == null) continue;

            Ranking ranking = rankings.get(i);
            TeamAward award = teamAwardRepository.save(TeamAward.builder()
                    .eventId(eventId)
                    .teamId(ranking.getTeamId())
                    .prizeId(prize.getId())
                    .awardedAt(now)
                    .build());
            results.add(toResponse(award, prize));
        }

        return results;
    }

    @Transactional(readOnly = true)
    public List<TeamAwardResponse> getAwards(UUID eventId) {
        List<Prize> prizes = prizeRepository.findByHackathonEventId(eventId);
        Map<UUID, Prize> prizeMap = prizes.stream()
                .collect(Collectors.toMap(Prize::getId, Function.identity()));

        return teamAwardRepository.findByEventIdOrderByAwardedAtAsc(eventId).stream()
                .map(ta -> toResponse(ta, prizeMap.get(ta.getPrizeId())))
                .sorted(Comparator.comparing(r -> rankOrder(r.getPrizeRank())))
                .toList();
    }

    private int rankOrder(PrizeRank rank) {
        if (rank == null) return 99;
        int idx = AWARD_ORDER.indexOf(rank);
        return idx >= 0 ? idx : 99;
    }

    private TeamAwardResponse toResponse(TeamAward award, Prize prize) {
        String teamName = teamPublicService.getTeam(award.getTeamId())
                .map(TeamSnapshot::getName)
                .orElse(null);
        return TeamAwardResponse.builder()
                .id(award.getId())
                .eventId(award.getEventId())
                .teamId(award.getTeamId())
                .teamName(teamName)
                .prizeId(award.getPrizeId())
                .prizeRank(prize != null ? prize.getRank() : null)
                .prizeLabel(prize != null ? prize.getLabel() : null)
                .prizeValue(prize != null ? prize.getValue() : null)
                .awardedAt(award.getAwardedAt())
                .build();
    }
}
