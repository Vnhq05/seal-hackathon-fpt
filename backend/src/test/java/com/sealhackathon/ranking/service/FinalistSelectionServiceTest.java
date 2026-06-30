package com.sealhackathon.ranking.service;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.AdvancementRule;
import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.EventService;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.ranking.domain.FinalistContestedSlot;
import com.sealhackathon.ranking.domain.FinalistSelection;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.domain.enums.AdvancementStatus;
import com.sealhackathon.ranking.dto.response.FinalistSelectResultResponse;
import com.sealhackathon.ranking.repository.FinalistContestedSlotRepository;
import com.sealhackathon.ranking.repository.FinalistSelectionRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.submission.service.SubmissionPublicService;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FinalistSelectionServiceTest {

    @Mock private FinalistSelectionRepository finalistRepository;
    @Mock private FinalistContestedSlotRepository contestedSlotRepository;
    @Mock private RankingRepository rankingRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private HackathonEventRepository eventRepository;
    @Mock private TrackRepository trackRepository;
    @Mock private TeamPublicService teamPublicService;
    @Mock private SubmissionPublicService submissionPublicService;
    @Mock private EventService eventService;
    @Mock private RankingTieBreakComparator tieBreakComparator;
    @Mock private FormatRuleEngine formatRuleEngine;

    @InjectMocks private FinalistSelectionService finalistSelectionService;

    private UUID eventId;
    private UUID roundId;
    private UUID trackA;
    private UUID trackB;
    private UUID trackC;

    @BeforeEach
    void setUp() {
        eventId = UUID.randomUUID();
        roundId = UUID.randomUUID();
        trackA = UUID.randomUUID();
        trackB = UUID.randomUUID();
        trackC = UUID.randomUUID();
        when(formatRuleEngine.getSealFinalistCount()).thenReturn(6);
        when(formatRuleEngine.getSealTopPerTrack()).thenReturn(2);
    }

    @Test
    void selectFinalists_sealFormat_selectsTop2PerTrack() {
        HackathonEvent event = HackathonEvent.builder()
                .competitionFormat(CompetitionFormat.SEAL_RAG_2026)
                .status(EventStatus.SCORING)
                .build();
        Round preliminary = mock(Round.class);
        when(preliminary.getId()).thenReturn(roundId);
        when(preliminary.getRoundType()).thenReturn(RoundType.PRELIMINARY);
        when(preliminary.getAdvancementCutoff()).thenReturn(2);

        List<UUID> teamIds = new ArrayList<>();
        List<Ranking> rankings = new ArrayList<>();
        for (int t = 0; t < 3; t++) {
            UUID trackId = t == 0 ? trackA : (t == 1 ? trackB : trackC);
            for (int i = 0; i < 2; i++) {
                UUID teamId = UUID.randomUUID();
                teamIds.add(teamId);
                rankings.add(ranking(teamId, BigDecimal.valueOf(90 - i - t * 10)));
                when(teamPublicService.getTeam(teamId)).thenReturn(Optional.of(
                        TeamSnapshot.builder().id(teamId).name("Team-" + teamId).trackId(trackId).build()));
            }
        }

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(eventService.resolveStatus(event)).thenReturn(EventStatus.SCORING);
        when(roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId)).thenReturn(List.of(preliminary));
        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(1);
        when(rankingRepository.findByRoundIdAndVersionOrderByRankAsc(roundId, 1)).thenReturn(rankings);

        when(tieBreakComparator.cutTopN(any(), any(Integer.class), any(UUID.class)))
                .thenAnswer(inv -> {
                    List<Ranking> list = inv.getArgument(0);
                    int n = inv.getArgument(1);
                    if (list.size() <= n) {
                        return new RankingTieBreakComparator.SelectionCutResult(list, List.of());
                    }
                    return new RankingTieBreakComparator.SelectionCutResult(list.subList(0, n), List.of());
                });

        when(finalistRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        FinalistSelectResultResponse result = finalistSelectionService.selectFinalists(eventId);

        assertThat(result.getFinalists()).hasSize(6);
        assertThat(result.getSummary().getSelectedCount()).isEqualTo(6);
        assertThat(result.getSummary().getTargetCount()).isEqualTo(6);
        assertThat(result.getSummary().isPenaltyEvaluationRequired()).isFalse();

        ArgumentCaptor<FinalistSelection> captor = ArgumentCaptor.forClass(FinalistSelection.class);
        verify(finalistRepository, org.mockito.Mockito.atLeast(6)).save(captor.capture());
    }

    @Test
    void selectFinalists_sealFormat_flagsContestedSlotOnTie() {
        HackathonEvent event = HackathonEvent.builder()
                .competitionFormat(CompetitionFormat.SEAL_RAG_2026)
                .status(EventStatus.SCORING)
                .build();
        Round preliminary = mock(Round.class);
        when(preliminary.getId()).thenReturn(roundId);
        when(preliminary.getRoundType()).thenReturn(RoundType.PRELIMINARY);
        when(preliminary.getAdvancementCutoff()).thenReturn(2);

        UUID team1 = UUID.randomUUID();
        UUID team2 = UUID.randomUUID();
        UUID team3 = UUID.randomUUID();
        Ranking r1 = ranking(team1, BigDecimal.valueOf(90));
        Ranking r2 = ranking(team2, BigDecimal.valueOf(85));
        Ranking r3 = ranking(team3, BigDecimal.valueOf(85));

        when(teamPublicService.getTeam(team1)).thenReturn(Optional.of(
                TeamSnapshot.builder().id(team1).name("T1").trackId(trackA).build()));
        when(teamPublicService.getTeam(team2)).thenReturn(Optional.of(
                TeamSnapshot.builder().id(team2).name("T2").trackId(trackA).build()));
        when(teamPublicService.getTeam(team3)).thenReturn(Optional.of(
                TeamSnapshot.builder().id(team3).name("T3").trackId(trackA).build()));

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(eventService.resolveStatus(event)).thenReturn(EventStatus.SCORING);
        when(roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId)).thenReturn(List.of(preliminary));
        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(1);
        when(rankingRepository.findByRoundIdAndVersionOrderByRankAsc(roundId, 1)).thenReturn(List.of(r1, r2, r3));

        when(tieBreakComparator.cutTopN(any(), any(Integer.class), any(UUID.class)))
                .thenReturn(new RankingTieBreakComparator.SelectionCutResult(
                        List.of(r1), List.of(r2, r3)));

        when(finalistRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(contestedSlotRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        FinalistSelectResultResponse result = finalistSelectionService.selectFinalists(eventId);

        assertThat(result.getFinalists()).hasSize(1);
        assertThat(result.getContestedSlots()).isNotEmpty();
        assertThat(result.getSummary().isPenaltyEvaluationRequired()).isTrue();
    }

    @Test
    void selectFinalists_genericFormat_usesGlobalCutoff() {
        UUID eventId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        HackathonEvent event = HackathonEvent.builder()
                .competitionFormat(CompetitionFormat.GENERIC)
                .status(EventStatus.SCORING)
                .build();
        Round preliminary = mock(Round.class);
        when(preliminary.getId()).thenReturn(roundId);
        when(preliminary.getRoundType()).thenReturn(RoundType.PRELIMINARY);
        when(preliminary.getAdvancementCutoff()).thenReturn(3);

        List<Ranking> rankings = List.of(
                ranking(UUID.randomUUID(), BigDecimal.valueOf(90)),
                ranking(UUID.randomUUID(), BigDecimal.valueOf(80)),
                ranking(UUID.randomUUID(), BigDecimal.valueOf(70)),
                ranking(UUID.randomUUID(), BigDecimal.valueOf(60)));

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(eventService.resolveStatus(event)).thenReturn(EventStatus.SCORING);
        when(roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId)).thenReturn(List.of(preliminary));
        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(1);
        when(rankingRepository.findByRoundIdAndVersionOrderByRankAsc(roundId, 1)).thenReturn(rankings);

        when(tieBreakComparator.cutTopN(rankings, 3, roundId))
                .thenReturn(new RankingTieBreakComparator.SelectionCutResult(
                        rankings.subList(0, 3), List.of()));

        when(finalistRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        FinalistSelectResultResponse result = finalistSelectionService.selectFinalists(eventId);

        assertThat(result.getFinalists()).hasSize(3);
        assertThat(result.getSummary().getTargetCount()).isEqualTo(3);
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
