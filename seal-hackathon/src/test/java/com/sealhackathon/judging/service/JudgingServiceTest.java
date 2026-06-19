package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.dto.request.ScoreDetailDto;
import com.sealhackathon.judging.dto.request.ScoreSubmissionRequest;
import com.sealhackathon.judging.dto.response.JudgeScoreResponse;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JudgingServiceTest {

    @Mock private JudgeScoreRepository judgeScoreRepository;
    @Mock private ConflictDetectionService conflictDetectionService;
    @Mock private EventPublicService eventPublicService;
    @Mock private UserPublicService userPublicService;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private JudgingService judgingService;

    private static final UUID JUDGE_ID = UUID.randomUUID();
    private static final UUID ROUND_ID = UUID.randomUUID();
    private static final UUID SUBMISSION_ID = UUID.randomUUID();
    private static final UUID CRITERIA_1 = UUID.randomUUID();
    private static final UUID CRITERIA_2 = UUID.randomUUID();

    // ── BR-35: Submit scores ──

    @Test
    void submitScore_shouldSucceed_whenAllValid() {
        setupValidContext();
        when(judgeScoreRepository.findByJudgeUserIdAndSubmissionId(JUDGE_ID, SUBMISSION_ID))
                .thenReturn(Optional.empty());
        when(judgeScoreRepository.save(any(JudgeScore.class))).thenAnswer(i -> {
            JudgeScore s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(userPublicService.findById(JUDGE_ID))
                .thenReturn(Optional.of(UserSnapshot.builder().fullName("Judge").build()));

        ScoreSubmissionRequest request = buildRequest(75, 80, null, null);

        JudgeScoreResponse result = judgingService.submitScore(JUDGE_ID, ROUND_ID, request);

        assertThat(result.getStatus()).isEqualTo(ScoreStatus.COMPLETED);
    }

    // ── BR-36: Comment required for score < 50 ──

    @Test
    void submitScore_shouldThrow_whenLowScoreWithoutComment() {
        setupValidContext();

        ScoreSubmissionRequest request = buildRequest(30, 80, null, null);

        assertThatThrownBy(() -> judgingService.submitScore(JUDGE_ID, ROUND_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Comment is required");
    }

    // ── BR-36: Comment required for score > 90 ──

    @Test
    void submitScore_shouldThrow_whenHighScoreWithoutComment() {
        setupValidContext();

        ScoreSubmissionRequest request = buildRequest(75, 95, null, null);

        assertThatThrownBy(() -> judgingService.submitScore(JUDGE_ID, ROUND_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Comment is required");
    }

    @Test
    void submitScore_shouldSucceed_whenExtremeScoreHasComment() {
        setupValidContext();
        when(judgeScoreRepository.findByJudgeUserIdAndSubmissionId(JUDGE_ID, SUBMISSION_ID))
                .thenReturn(Optional.empty());
        when(judgeScoreRepository.save(any(JudgeScore.class))).thenAnswer(i -> {
            JudgeScore s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(userPublicService.findById(JUDGE_ID))
                .thenReturn(Optional.of(UserSnapshot.builder().fullName("Judge").build()));

        ScoreSubmissionRequest request = buildRequest(30, 95, "Too basic", "Outstanding");

        JudgeScoreResponse result = judgingService.submitScore(JUDGE_ID, ROUND_ID, request);

        assertThat(result.getStatus()).isEqualTo(ScoreStatus.COMPLETED);
    }

    // ── BR-40: Scoring deadline ──

    @Test
    void submitScore_shouldThrow_whenDeadlinePassed() {
        when(eventPublicService.getScoringDeadline(ROUND_ID))
                .thenReturn(LocalDateTime.now().minusDays(1));

        ScoreSubmissionRequest request = buildRequest(70, 80, null, null);

        assertThatThrownBy(() -> judgingService.submitScore(JUDGE_ID, ROUND_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("deadline");
    }

    // ── Not assigned to round ──

    @Test
    void submitScore_shouldThrow_whenNotAssigned() {
        when(eventPublicService.getScoringDeadline(ROUND_ID))
                .thenReturn(LocalDateTime.now().plusDays(1));
        when(eventPublicService.isJudgeAssignedToRound(JUDGE_ID, ROUND_ID)).thenReturn(false);

        ScoreSubmissionRequest request = buildRequest(70, 80, null, null);

        assertThatThrownBy(() -> judgingService.submitScore(JUDGE_ID, ROUND_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not assigned");
    }

    // ── BR-39/40: Update locked score ──

    @Test
    void updateScore_shouldThrow_whenLocked() {
        UUID scoreId = UUID.randomUUID();
        JudgeScore locked = JudgeScore.builder()
                .judgeUserId(JUDGE_ID).submissionId(SUBMISSION_ID).roundId(ROUND_ID)
                .status(ScoreStatus.LOCKED).startedAt(LocalDateTime.now().minusHours(1))
                .build();
        locked.setId(scoreId);

        when(judgeScoreRepository.findById(scoreId)).thenReturn(Optional.of(locked));

        ScoreSubmissionRequest request = buildRequest(70, 80, null, null);

        assertThatThrownBy(() -> judgingService.updateScore(JUDGE_ID, scoreId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("locked");
    }

    // ── BR-37: 2h timer ──

    @Test
    void updateScore_shouldThrow_whenTimerExpired() {
        UUID scoreId = UUID.randomUUID();
        JudgeScore expired = JudgeScore.builder()
                .judgeUserId(JUDGE_ID).submissionId(SUBMISSION_ID).roundId(ROUND_ID)
                .status(ScoreStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now().minusHours(3))
                .build();
        expired.setId(scoreId);

        when(judgeScoreRepository.findById(scoreId)).thenReturn(Optional.of(expired));

        ScoreSubmissionRequest request = buildRequest(70, 80, null, null);

        assertThatThrownBy(() -> judgingService.updateScore(JUDGE_ID, scoreId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("timer");
    }

    // ── Criteria mismatch ──

    @Test
    void submitScore_shouldThrow_whenCriteriaMismatch() {
        setupValidContext();

        UUID wrongCriteria = UUID.randomUUID();
        ScoreSubmissionRequest request = ScoreSubmissionRequest.builder()
                .submissionId(SUBMISSION_ID)
                .scores(List.of(
                        ScoreDetailDto.builder().criteriaId(CRITERIA_1).score(70).build(),
                        ScoreDetailDto.builder().criteriaId(wrongCriteria).score(80).build()
                ))
                .build();

        assertThatThrownBy(() -> judgingService.submitScore(JUDGE_ID, ROUND_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("does not belong");
    }

    // ── Wrong judge trying to update ──

    @Test
    void updateScore_shouldThrow_whenNotOwner() {
        UUID scoreId = UUID.randomUUID();
        UUID otherJudge = UUID.randomUUID();
        JudgeScore score = JudgeScore.builder()
                .judgeUserId(otherJudge).submissionId(SUBMISSION_ID).roundId(ROUND_ID)
                .status(ScoreStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .build();
        score.setId(scoreId);

        when(judgeScoreRepository.findById(scoreId)).thenReturn(Optional.of(score));

        ScoreSubmissionRequest request = buildRequest(70, 80, null, null);

        assertThatThrownBy(() -> judgingService.updateScore(JUDGE_ID, scoreId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("own scores");
    }

    // ═══ Helpers ═══

    private void setupValidContext() {
        when(eventPublicService.getScoringDeadline(ROUND_ID))
                .thenReturn(LocalDateTime.now().plusDays(1));
        when(eventPublicService.isJudgeAssignedToRound(JUDGE_ID, ROUND_ID)).thenReturn(true);
        when(eventPublicService.getCriteriaByRound(ROUND_ID)).thenReturn(List.of(
                CriteriaSnapshot.builder().id(CRITERIA_1).name("Technical").weight(50).build(),
                CriteriaSnapshot.builder().id(CRITERIA_2).name("Innovation").weight(50).build()
        ));
    }

    private ScoreSubmissionRequest buildRequest(int score1, int score2,
                                                 String comment1, String comment2) {
        return ScoreSubmissionRequest.builder()
                .submissionId(SUBMISSION_ID)
                .scores(List.of(
                        ScoreDetailDto.builder()
                                .criteriaId(CRITERIA_1).score(score1).comment(comment1).build(),
                        ScoreDetailDto.builder()
                                .criteriaId(CRITERIA_2).score(score2).comment(comment2).build()
                ))
                .build();
    }
}
