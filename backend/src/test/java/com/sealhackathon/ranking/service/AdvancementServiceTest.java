package com.sealhackathon.ranking.service;

import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.AdvancementRule;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.ranking.domain.Advancement;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.domain.enums.AdvancementStatus;
import com.sealhackathon.ranking.dto.response.AdvancementResponse;
import com.sealhackathon.ranking.repository.AdvancementRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdvancementServiceTest {

    @Mock private AdvancementRepository advancementRepository;
    @Mock private RankingRepository rankingRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private TeamPublicService teamPublicService;

    @InjectMocks private AdvancementService advancementService;

    @Test
    void determineAdvancements_globalTopN_marksTopRanked() {
        UUID roundId = UUID.randomUUID();
        UUID team1 = UUID.randomUUID();
        UUID team2 = UUID.randomUUID();
        UUID team3 = UUID.randomUUID();

        Round round = mock(Round.class);
        when(round.getAdvancementCutoff()).thenReturn(2);
        when(round.getAdvancementRule()).thenReturn(AdvancementRule.GLOBAL_TOP_N);

        List<Ranking> rankings = List.of(
                ranking(team1, roundId, 1, BigDecimal.valueOf(90)),
                ranking(team2, roundId, 2, BigDecimal.valueOf(80)),
                ranking(team3, roundId, 3, BigDecimal.valueOf(70)));

        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(1);
        when(rankingRepository.findByRoundIdAndVersionOrderByRankAsc(roundId, 1)).thenReturn(rankings);
        when(advancementRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        when(teamPublicService.getTeam(any())).thenReturn(Optional.of(
                TeamSnapshot.builder().name("Team").build()));

        List<AdvancementResponse> result = advancementService.determineAdvancements(roundId);

        assertThat(result).hasSize(3);
        assertThat(result.stream().filter(r -> r.getStatus() == AdvancementStatus.ADVANCED)).hasSize(2);
        assertThat(result.stream().filter(r -> r.getStatus() == AdvancementStatus.ELIMINATED)).hasSize(1);
    }

    @Test
    void determineAdvancements_perTrackTopN_advancesTop2PerTrack() {
        UUID roundId = UUID.randomUUID();
        UUID trackA = UUID.randomUUID();
        UUID trackB = UUID.randomUUID();

        UUID a1 = UUID.randomUUID();
        UUID a2 = UUID.randomUUID();
        UUID a3 = UUID.randomUUID();
        UUID b1 = UUID.randomUUID();
        UUID b2 = UUID.randomUUID();

        Round round = mock(Round.class);
        when(round.getAdvancementCutoff()).thenReturn(2);
        when(round.getAdvancementRule()).thenReturn(AdvancementRule.PER_TRACK_TOP_N);

        List<Ranking> rankings = List.of(
                ranking(a1, roundId, 1, BigDecimal.valueOf(95)),
                ranking(b1, roundId, 2, BigDecimal.valueOf(90)),
                ranking(a2, roundId, 3, BigDecimal.valueOf(85)),
                ranking(b2, roundId, 4, BigDecimal.valueOf(80)),
                ranking(a3, roundId, 5, BigDecimal.valueOf(75)));

        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(1);
        when(rankingRepository.findByRoundIdAndVersionOrderByRankAsc(roundId, 1)).thenReturn(rankings);
        when(advancementRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        when(teamPublicService.getTeam(a1)).thenReturn(Optional.of(team(a1, trackA)));
        when(teamPublicService.getTeam(a2)).thenReturn(Optional.of(team(a2, trackA)));
        when(teamPublicService.getTeam(a3)).thenReturn(Optional.of(team(a3, trackA)));
        when(teamPublicService.getTeam(b1)).thenReturn(Optional.of(team(b1, trackB)));
        when(teamPublicService.getTeam(b2)).thenReturn(Optional.of(team(b2, trackB)));

        List<AdvancementResponse> result = advancementService.determineAdvancements(roundId);

        assertThat(result.stream().filter(r -> r.getStatus() == AdvancementStatus.ADVANCED).map(AdvancementResponse::getTeamId))
                .containsExactlyInAnyOrder(a1, a2, b1, b2);
        assertThat(result.stream().filter(r -> r.getStatus() == AdvancementStatus.ELIMINATED).map(AdvancementResponse::getTeamId))
                .containsExactly(a3);
    }

    private TeamSnapshot team(UUID id, UUID trackId) {
        return TeamSnapshot.builder().id(id).name("T-" + id).trackId(trackId).build();
    }

    private Ranking ranking(UUID teamId, UUID roundId, int rank, BigDecimal score) {
        return Ranking.builder()
                .teamId(teamId)
                .roundId(roundId)
                .rank(rank)
                .finalScore(score)
                .version(1)
                .calculatedAt(LocalDateTime.now())
                .build();
    }
}
