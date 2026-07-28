package com.sealhackathon.ranking.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.dto.request.AdvancementSelectionRequest;
import com.sealhackathon.ranking.dto.response.AdvancementSelectionPreviewResponse;
import com.sealhackathon.ranking.repository.AdvancementRepository;
import com.sealhackathon.ranking.repository.FinalistContestedSlotRepository;
import com.sealhackathon.ranking.repository.FinalistSelectionRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.submission.service.FinalSubmissionCarryOverService;
import com.sealhackathon.submission.service.SubmissionPublicService;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdvancementServiceTest {

    @Mock private AdvancementRepository advancementRepository;
    @Mock private RankingRepository rankingRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private TrackRepository trackRepository;
    @Mock private CompetitionGroupRepository competitionGroupRepository;
    @Mock private TeamPublicService teamPublicService;
    @Mock private RankingTieBreakComparator tieBreakComparator;
    @Mock private FinalistSelectionRepository finalistRepository;
    @Mock private FinalistContestedSlotRepository contestedSlotRepository;
    @Mock private FinalSubmissionCarryOverService finalSubmissionCarryOverService;
    @Mock private SubmissionPublicService submissionPublicService;

    @InjectMocks private AdvancementService advancementService;

    @Test
    void preview_auto_topN_perTrack() {
        UUID eventId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        UUID nextId = UUID.randomUUID();
        UUID trackA = UUID.randomUUID();
        UUID trackB = UUID.randomUUID();
        UUID a1 = UUID.randomUUID();
        UUID a2 = UUID.randomUUID();
        UUID a3 = UUID.randomUUID();
        UUID b1 = UUID.randomUUID();

        HackathonEvent event = mock(HackathonEvent.class);
        when(event.getId()).thenReturn(eventId);

        Round round = mock(Round.class);
        when(round.getId()).thenReturn(roundId);
        when(round.getName()).thenReturn("Prelim");
        when(round.getRoundNumber()).thenReturn(1);
        when(round.getRoundType()).thenReturn(RoundType.PRELIMINARY);
        when(round.getHackathonEvent()).thenReturn(event);

        Round next = mock(Round.class);
        when(next.getId()).thenReturn(nextId);
        when(next.getName()).thenReturn("Final");
        when(next.getRoundNumber()).thenReturn(2);
        when(next.getRoundType()).thenReturn(RoundType.FINAL);

        List<Ranking> rankings = List.of(
                ranking(a1, roundId, 1, BigDecimal.valueOf(95)),
                ranking(b1, roundId, 2, BigDecimal.valueOf(90)),
                ranking(a2, roundId, 3, BigDecimal.valueOf(85)),
                ranking(a3, roundId, 4, BigDecimal.valueOf(70)));

        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId))
                .thenReturn(List.of(round, next));
        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(1);
        when(rankingRepository.findByRoundIdAndVersionOrderByRankAsc(roundId, 1)).thenReturn(rankings);
        when(teamPublicService.getTeam(a1)).thenReturn(Optional.of(team(a1, trackA)));
        when(teamPublicService.getTeam(a2)).thenReturn(Optional.of(team(a2, trackA)));
        when(teamPublicService.getTeam(a3)).thenReturn(Optional.of(team(a3, trackA)));
        when(teamPublicService.getTeam(b1)).thenReturn(Optional.of(team(b1, trackB)));

        when(tieBreakComparator.cutTopN(any(), eq(2), eq(roundId)))
                .thenAnswer(inv -> {
                    List<Ranking> bucket = inv.getArgument(0);
                    List<Ranking> selected = bucket.stream().limit(2).toList();
                    return new RankingTieBreakComparator.SelectionCutResult(selected, List.of());
                });

        AdvancementSelectionPreviewResponse preview = advancementService.preview(roundId,
                AdvancementSelectionRequest.builder()
                        .mode(AdvancementSelectionRequest.Mode.AUTO)
                        .topN(2)
                        .build());

        assertThat(preview.getScope().name()).isEqualTo("TRACK");
        assertThat(preview.isNextIsFinal()).isTrue();
        assertThat(preview.getSelected()).hasSize(3); // 2 from A + 1 from B
        assertThat(preview.isConfirmed()).isFalse();
    }

    @Test
    void preview_manual_selectsRequestedTeams() {
        UUID eventId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        UUID nextId = UUID.randomUUID();
        UUID team1 = UUID.randomUUID();
        UUID team2 = UUID.randomUUID();
        UUID team3 = UUID.randomUUID();

        HackathonEvent event = mock(HackathonEvent.class);
        when(event.getId()).thenReturn(eventId);

        Round round = mock(Round.class);
        when(round.getId()).thenReturn(roundId);
        when(round.getName()).thenReturn("R1");
        when(round.getRoundNumber()).thenReturn(1);
        when(round.getRoundType()).thenReturn(RoundType.PRELIMINARY);
        when(round.getHackathonEvent()).thenReturn(event);

        Round next = mock(Round.class);
        when(next.getId()).thenReturn(nextId);
        when(next.getName()).thenReturn("R2");
        when(next.getRoundNumber()).thenReturn(2);
        when(next.getRoundType()).thenReturn(RoundType.PRELIMINARY);

        List<Ranking> rankings = List.of(
                ranking(team1, roundId, 1, BigDecimal.valueOf(90)),
                ranking(team2, roundId, 2, BigDecimal.valueOf(80)),
                ranking(team3, roundId, 3, BigDecimal.valueOf(70)));

        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId))
                .thenReturn(List.of(round, next));
        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(1);
        when(rankingRepository.findByRoundIdAndVersionOrderByRankAsc(roundId, 1)).thenReturn(rankings);
        when(teamPublicService.getTeam(any())).thenReturn(Optional.of(
                TeamSnapshot.builder().name("Team").build()));

        AdvancementSelectionPreviewResponse preview = advancementService.preview(roundId,
                AdvancementSelectionRequest.builder()
                        .mode(AdvancementSelectionRequest.Mode.MANUAL)
                        .teamIds(List.of(team1, team3))
                        .build());

        assertThat(preview.getSelected()).extracting(AdvancementSelectionPreviewResponse.SelectedTeam::getTeamId)
                .containsExactly(team1, team3);
        assertThat(preview.getEliminatedCount()).isEqualTo(1);
    }

    @Test
    void determineAdvancements_withoutConfirm_throws() {
        UUID roundId = UUID.randomUUID();
        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(1);
        when(rankingRepository.findByRoundIdAndVersionOrderByRankAsc(roundId, 1)).thenReturn(List.of());
        when(advancementRepository.findByRoundId(roundId)).thenReturn(List.of());

        assertThatThrownBy(() -> advancementService.determineAdvancements(roundId))
                .isInstanceOf(BusinessException.class);
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
