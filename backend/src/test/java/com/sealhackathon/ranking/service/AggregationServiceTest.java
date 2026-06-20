package com.sealhackathon.ranking.service;

import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
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

    // ── BR-45: Regular mean (< 5 judges) ──

    @Test
    void computeMean_shouldReturnAverage_forRegularCase() {
        BigDecimal mean = aggregationService.computeMean(List.of(70, 80, 90));
        assertThat(mean).isEqualByComparingTo(BigDecimal.valueOf(80));
    }

    // ── BR-46: Trimmed mean (≥ 5 judges) ──

    @Test
    void computeMean_shouldTrim_when5OrMoreScores() {
        // Scores: 50, 60, 70, 80, 100 → trim 50 and 100 → mean of 60, 70, 80 = 70
        BigDecimal mean = aggregationService.computeMean(List.of(50, 60, 70, 80, 100));
        assertThat(mean).isEqualByComparingTo(BigDecimal.valueOf(70));
    }

    @Test
    void computeMean_shouldTrim_when6Scores() {
        // Scores: 40, 55, 65, 75, 85, 95 → trim 40 and 95 → mean of 55, 65, 75, 85 = 70
        BigDecimal mean = aggregationService.computeMean(List.of(40, 55, 65, 75, 85, 95));
        assertThat(mean).isEqualByComparingTo(BigDecimal.valueOf(70));
    }

    @Test
    void computeMean_shouldNotTrim_when4Scores() {
        // 4 judges < 5 → no trimming → mean of 60, 70, 80, 90 = 75
        BigDecimal mean = aggregationService.computeMean(List.of(60, 70, 80, 90));
        assertThat(mean).isEqualByComparingTo(BigDecimal.valueOf(75));
    }

    @Test
    void computeMean_shouldReturnZero_whenEmpty() {
        BigDecimal mean = aggregationService.computeMean(List.of());
        assertThat(mean).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // ── BR-44: Weighted final score ──

    @Test
    void computeFinalScore_shouldApplyWeights() {
        UUID c1 = UUID.randomUUID();
        UUID c2 = UUID.randomUUID();

        List<CriteriaSnapshot> criteria = List.of(
                CriteriaSnapshot.builder().id(c1).name("Technical").weight(60).sortOrder(1).build(),
                CriteriaSnapshot.builder().id(c2).name("Innovation").weight(40).sortOrder(2).build()
        );
        Map<UUID, Integer> weightMap = Map.of(c1, 60, c2, 40);

        // Judge 1: Technical=80, Innovation=90
        // Judge 2: Technical=70, Innovation=80
        // Mean: Technical=75, Innovation=85
        // Final = 75 * 0.60 + 85 * 0.40 = 45 + 34 = 79
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

        BigDecimal result = aggregationService.computeFinalScore(
                List.of(j1, j2), weightMap, criteria);

        assertThat(result).isEqualByComparingTo(BigDecimal.valueOf(79).setScale(4, RoundingMode.HALF_UP));
    }

    // ── BR-50: Exclude DRAFT/NOT_SCORED ──

    @Test
    void recalculate_shouldExcludePendingSubmissions() {
        UUID roundId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();
        UUID c1 = UUID.randomUUID();

        when(eventPublicService.getCriteriaByRound(roundId)).thenReturn(List.of(
                CriteriaSnapshot.builder().id(c1).name("Tech").weight(100).sortOrder(1).build()
        ));

        // One SUBMITTED, one DRAFT → only SUBMITTED counted
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

    // ── BR-47: Tie-break by criteria order then submittedAt ──

    @Test
    void recalculate_shouldBreakTieBySubmittedAt() {
        UUID roundId = UUID.randomUUID();
        UUID c1 = UUID.randomUUID();
        UUID teamA = UUID.randomUUID();
        UUID teamB = UUID.randomUUID();
        UUID subA = UUID.randomUUID();
        UUID subB = UUID.randomUUID();

        when(eventPublicService.getCriteriaByRound(roundId)).thenReturn(List.of(
                CriteriaSnapshot.builder().id(c1).name("Tech").weight(100).sortOrder(1).build()
        ));

        when(submissionPublicService.getSubmissionsByRound(roundId)).thenReturn(List.of(
                SubmissionSnapshot.builder().id(subA).teamId(teamA).roundId(roundId)
                        .status(SubmissionStatus.SUBMITTED).build(),
                SubmissionSnapshot.builder().id(subB).teamId(teamB).roundId(roundId)
                        .status(SubmissionStatus.SUBMITTED).build()
        ));

        // Same score for both
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

        // Team A submitted earlier
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
        assertThat(rankings.get(1).getRank()).isEqualTo(2);
    }
}
