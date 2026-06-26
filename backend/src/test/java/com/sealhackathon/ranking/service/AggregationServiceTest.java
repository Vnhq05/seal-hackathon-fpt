package com.sealhackathon.ranking.service;

import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.dto.snapshot.JudgeScoreSnapshot;
import com.sealhackathon.judging.dto.snapshot.ScoreDetailSnapshot;
import com.sealhackathon.judging.service.JudgingPublicService;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.dto.snapshot.SubmissionSnapshot;
import com.sealhackathon.submission.service.SubmissionPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AggregationServiceTest {

    @Mock private JudgingPublicService judgingPublicService;
    @Mock private EventPublicService eventPublicService;
    @Mock private SubmissionPublicService submissionPublicService;
    @Mock private RankingRepository rankingRepository;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private AggregationService aggregationService;

    @Test
    void computeWeightedJudgeScore_shouldApplyCriterionWeights() {
        UUID c1 = UUID.randomUUID();
        UUID c2 = UUID.randomUUID();

        List<CriteriaSnapshot> criteria = List.of(
                CriteriaSnapshot.builder().id(c1).name("Technical").weight(60).sortOrder(1).build(),
                CriteriaSnapshot.builder().id(c2).name("Innovation").weight(40).sortOrder(2).build()
        );
        Map<UUID, Integer> weightMap = Map.of(c1, 60, c2, 40);

        JudgeScoreSnapshot judge = JudgeScoreSnapshot.builder()
                .id(UUID.randomUUID()).status(ScoreStatus.COMPLETED)
                .details(List.of(
                        ScoreDetailSnapshot.builder().criteriaId(c1).score(80).build(),
                        ScoreDetailSnapshot.builder().criteriaId(c2).score(90).build()
                )).build();

        // 80×0.6 + 90×0.4 = 48 + 36 = 84
        BigDecimal result = aggregationService.computeWeightedJudgeScore(judge, weightMap, criteria);
        assertThat(result).isEqualByComparingTo(BigDecimal.valueOf(84).setScale(4, RoundingMode.HALF_UP));
    }

    @Test
    void computeRoundScore_shouldAverageWeightedJudgeScores() {
        UUID c1 = UUID.randomUUID();
        UUID c2 = UUID.randomUUID();

        List<CriteriaSnapshot> criteria = List.of(
                CriteriaSnapshot.builder().id(c1).name("Technical").weight(60).sortOrder(1).build(),
                CriteriaSnapshot.builder().id(c2).name("Innovation").weight(40).sortOrder(2).build()
        );
        Map<UUID, Integer> weightMap = Map.of(c1, 60, c2, 40);

        // Judge 1 weighted: 84, Judge 2 weighted: 74 → RoundScore = 79
        JudgeScoreSnapshot j1 = JudgeScoreSnapshot.builder()
                .id(UUID.randomUUID()).status(ScoreStatus.COMPLETED)
                .details(List.of(
                        ScoreDetailSnapshot.builder().criteriaId(c1).score(80).build(),
                        ScoreDetailSnapshot.builder().criteriaId(c2).score(90).build()
                )).build();

        JudgeScoreSnapshot j2 = JudgeScoreSnapshot.builder()
                .id(UUID.randomUUID()).status(ScoreStatus.COMPLETED)
                .details(List.of(
                        ScoreDetailSnapshot.builder().criteriaId(c1).score(70).build(),
                        ScoreDetailSnapshot.builder().criteriaId(c2).score(80).build()
                )).build();

        BigDecimal result = aggregationService.computeRoundScore(List.of(j1, j2), weightMap, criteria);
        assertThat(result).isEqualByComparingTo(BigDecimal.valueOf(79).setScale(4, RoundingMode.HALF_UP));
    }

    @Test
    void computeRoundScore_shouldApplyTrimmedMeanWhenFiveOrMoreJudges() {
        UUID c1 = UUID.randomUUID();
        List<CriteriaSnapshot> criteria = List.of(
                CriteriaSnapshot.builder().id(c1).name("Tech").weight(100).sortOrder(1).build()
        );
        Map<UUID, Integer> weightMap = Map.of(c1, 100);

        List<JudgeScoreSnapshot> judges = List.of(10, 20, 30, 40, 100).stream()
                .map(score -> JudgeScoreSnapshot.builder()
                        .id(UUID.randomUUID()).status(ScoreStatus.COMPLETED)
                        .details(List.of(ScoreDetailSnapshot.builder().criteriaId(c1).score(score).build()))
                        .build())
                .toList();

        // BR-46: drop 10 and 100 → mean of 20, 30, 40 = 30
        BigDecimal result = aggregationService.computeRoundScore(judges, weightMap, criteria);
        assertThat(result).isEqualByComparingTo(BigDecimal.valueOf(30).setScale(4, RoundingMode.HALF_UP));
    }

    @Test
    void recalculate_shouldExcludePendingSubmissions() {
        UUID roundId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();
        UUID c1 = UUID.randomUUID();

        when(eventPublicService.getCriteriaByRound(roundId)).thenReturn(List.of(
                CriteriaSnapshot.builder().id(c1).name("Tech").weight(100).sortOrder(1).build()
        ));
        when(eventPublicService.getRound(roundId)).thenReturn(Optional.of(
                RoundSnapshot.builder().id(roundId).eventId(eventId).build()));
        when(eventPublicService.getEvent(eventId)).thenReturn(Optional.of(
                EventSnapshot.builder().id(eventId).build()));

        when(submissionPublicService.getSubmissionsByRound(roundId)).thenReturn(List.of(
                SubmissionSnapshot.builder().id(submissionId).teamId(teamId)
                        .roundId(roundId).status(SubmissionStatus.SUBMITTED).build(),
                SubmissionSnapshot.builder().id(UUID.randomUUID()).teamId(UUID.randomUUID())
                        .roundId(roundId).status(SubmissionStatus.DRAFT).build()
        ));

        when(judgingPublicService.getScoresBySubmission(submissionId)).thenReturn(List.of(
                JudgeScoreSnapshot.builder().id(UUID.randomUUID())
                        .status(ScoreStatus.COMPLETED)
                        .details(List.of(ScoreDetailSnapshot.builder().criteriaId(c1).score(80).build()))
                        .build()
        ));
        when(submissionPublicService.getSubmittedAt(submissionId))
                .thenReturn(LocalDateTime.now());

        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(0);
        when(rankingRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        List<Ranking> rankings = aggregationService.recalculate(roundId);

        assertThat(rankings).hasSize(1);
        assertThat(rankings.get(0).getTeamId()).isEqualTo(teamId);
        assertThat(rankings.get(0).getRank()).isEqualTo(1);
    }

    @Test
    void recalculate_shouldBreakTieBySubmittedAt() {
        UUID roundId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID c1 = UUID.randomUUID();
        UUID teamA = UUID.randomUUID();
        UUID teamB = UUID.randomUUID();
        UUID subA = UUID.randomUUID();
        UUID subB = UUID.randomUUID();

        when(eventPublicService.getCriteriaByRound(roundId)).thenReturn(List.of(
                CriteriaSnapshot.builder().id(c1).name("Tech").weight(100).sortOrder(1).build()
        ));
        when(eventPublicService.getRound(roundId)).thenReturn(Optional.of(
                RoundSnapshot.builder().id(roundId).eventId(eventId).build()));
        when(eventPublicService.getEvent(eventId)).thenReturn(Optional.of(
                EventSnapshot.builder().id(eventId).build()));

        when(submissionPublicService.getSubmissionsByRound(roundId)).thenReturn(List.of(
                SubmissionSnapshot.builder().id(subA).teamId(teamA).roundId(roundId)
                        .status(SubmissionStatus.SUBMITTED).build(),
                SubmissionSnapshot.builder().id(subB).teamId(teamB).roundId(roundId)
                        .status(SubmissionStatus.SUBMITTED).build()
        ));

        when(judgingPublicService.getScoresBySubmission(subA)).thenReturn(List.of(
                JudgeScoreSnapshot.builder().id(UUID.randomUUID()).status(ScoreStatus.COMPLETED)
                        .details(List.of(ScoreDetailSnapshot.builder().criteriaId(c1).score(80).build()))
                        .build()
        ));
        when(judgingPublicService.getScoresBySubmission(subB)).thenReturn(List.of(
                JudgeScoreSnapshot.builder().id(UUID.randomUUID()).status(ScoreStatus.COMPLETED)
                        .details(List.of(ScoreDetailSnapshot.builder().criteriaId(c1).score(80).build()))
                        .build()
        ));

        when(submissionPublicService.getSubmittedAt(subA))
                .thenReturn(LocalDateTime.of(2026, 7, 1, 10, 0));
        when(submissionPublicService.getSubmittedAt(subB))
                .thenReturn(LocalDateTime.of(2026, 7, 1, 14, 0));

        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(0);
        when(rankingRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        List<Ranking> rankings = aggregationService.recalculate(roundId);

        assertThat(rankings).hasSize(2);
        assertThat(rankings.get(0).getTeamId()).isEqualTo(teamA);
        assertThat(rankings.get(0).getRank()).isEqualTo(1);
        assertThat(rankings.get(1).getTeamId()).isEqualTo(teamB);
        assertThat(rankings.get(1).getRank()).isEqualTo(1);
    }
}
