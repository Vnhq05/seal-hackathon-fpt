package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.TeamJudgeAssignment;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.dto.request.ScoreDetailDto;
import com.sealhackathon.judging.dto.request.ScoreSubmissionRequest;
import com.sealhackathon.judging.dto.response.JudgeScoringAssignmentResponse;
import com.sealhackathon.judging.dto.response.JudgeScoreResponse;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.dto.snapshot.SubmissionSnapshot;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.service.SubmissionPublicService;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.team.service.TeamPublicService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JudgingServiceTest {

    @Mock private JudgeScoreRepository judgeScoreRepository;
    @Mock private TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;
    @Mock private SubmissionRepository submissionRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private HackathonEventRepository eventRepository;
    @Mock private TrackRepository trackRepository;
    @Mock private ConflictDetectionService conflictDetectionService;
    @Mock private ScoreReviewService scoreReviewService;
    @Mock private EventPublicService eventPublicService;
    @Mock private SubmissionPublicService submissionPublicService;
    @Mock private TeamPublicService teamPublicService;
    @Mock private UserPublicService userPublicService;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private JudgingService judgingService;

    private static final UUID JUDGE_ID = UUID.randomUUID();
    private static final UUID ROUND_ID = UUID.randomUUID();
    private static final UUID SUBMISSION_ID = UUID.randomUUID();
    private static final UUID TEAM_ID = UUID.randomUUID();
    private static final UUID CRITERIA_1 = UUID.randomUUID();
    private static final UUID CRITERIA_2 = UUID.randomUUID();

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

        ScoreSubmissionRequest request = buildRequest(7, 8, null, null);

        JudgeScoreResponse result = judgingService.submitScore(JUDGE_ID, ROUND_ID, request);

        assertThat(result.getStatus()).isEqualTo(ScoreStatus.COMPLETED);
    }

    @Test
    void submitScore_shouldThrow_whenLowScoreWithoutComment() {
        setupValidContext();

        ScoreSubmissionRequest request = buildRequest(0, 8, null, null);

        assertThatThrownBy(() -> judgingService.submitScore(JUDGE_ID, ROUND_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Comment is required");
    }

    @Test
    void submitScore_shouldThrow_whenHighScoreWithoutComment() {
        setupValidContext();

        ScoreSubmissionRequest request = buildRequest(7, 10, null, null);

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

        ScoreSubmissionRequest request = buildRequest(3, 10, "At minimum", "Outstanding");

        JudgeScoreResponse result = judgingService.submitScore(JUDGE_ID, ROUND_ID, request);

        assertThat(result.getStatus()).isEqualTo(ScoreStatus.COMPLETED);
    }

    @Test
    void submitScore_shouldThrow_whenDeadlinePassed() {
        when(eventPublicService.getScoringDeadline(ROUND_ID))
                .thenReturn(LocalDateTime.now().minusDays(1));

        ScoreSubmissionRequest request = buildRequest(7, 8, null, null);

        assertThatThrownBy(() -> judgingService.submitScore(JUDGE_ID, ROUND_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("deadline");
    }

    @Test
    void submitScore_shouldThrow_whenNotAssigned() {
        when(eventPublicService.getScoringDeadline(ROUND_ID))
                .thenReturn(LocalDateTime.now().plusDays(1));
        when(submissionPublicService.getSubmission(SUBMISSION_ID))
                .thenReturn(Optional.of(SubmissionSnapshot.builder().id(SUBMISSION_ID).teamId(TEAM_ID).build()));
        when(teamJudgeAssignmentRepository.existsByTeamIdAndRoundIdAndJudgeUserId(TEAM_ID, ROUND_ID, JUDGE_ID))
                .thenReturn(false);

        ScoreSubmissionRequest request = buildRequest(7, 8, null, null);

        assertThatThrownBy(() -> judgingService.submitScore(JUDGE_ID, ROUND_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not assigned");
    }

    @Test
    void updateScore_shouldThrow_whenLocked() {
        UUID scoreId = UUID.randomUUID();
        JudgeScore locked = JudgeScore.builder()
                .judgeUserId(JUDGE_ID).submissionId(SUBMISSION_ID).roundId(ROUND_ID)
                .status(ScoreStatus.LOCKED).startedAt(LocalDateTime.now().minusHours(1))
                .build();
        locked.setId(scoreId);

        when(judgeScoreRepository.findById(scoreId)).thenReturn(Optional.of(locked));

        ScoreSubmissionRequest request = buildRequest(7, 8, null, null);

        assertThatThrownBy(() -> judgingService.updateScore(JUDGE_ID, scoreId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("locked");
    }

    @Test
    void getMyScoringAssignments_shouldExcludeOrphanRoundOrTeam() {
        UUID orphanRoundId = UUID.randomUUID();
        UUID validRoundId = UUID.randomUUID();
        UUID orphanTeamId = UUID.randomUUID();
        UUID validTeamId = UUID.randomUUID();

        TeamJudgeAssignment orphanTeam = TeamJudgeAssignment.builder()
                .teamId(orphanTeamId).roundId(validRoundId).judgeUserId(JUDGE_ID).build();
        TeamJudgeAssignment orphanRound = TeamJudgeAssignment.builder()
                .teamId(validTeamId).roundId(orphanRoundId).judgeUserId(JUDGE_ID).build();
        TeamJudgeAssignment valid = TeamJudgeAssignment.builder()
                .teamId(validTeamId).roundId(validRoundId).judgeUserId(JUDGE_ID).build();

        when(teamJudgeAssignmentRepository.findByJudgeUserId(JUDGE_ID))
                .thenReturn(List.of(orphanTeam, orphanRound, valid));
        when(roundRepository.existsById(validRoundId)).thenReturn(true);
        when(roundRepository.existsById(orphanRoundId)).thenReturn(false);
        when(teamRepository.existsById(validTeamId)).thenReturn(true);
        when(teamRepository.existsById(orphanTeamId)).thenReturn(false);

        Team team = Team.builder().eventId(UUID.randomUUID()).name("Team Alpha").build();
        team.setId(validTeamId);
        Round round = Round.builder()
                .name("Round One")
                .scoringDeadline(LocalDateTime.now().plusDays(1))
                .build();
        round.setId(validRoundId);

        when(teamRepository.findById(validTeamId)).thenReturn(Optional.of(team));
        when(roundRepository.findById(validRoundId)).thenReturn(Optional.of(round));
        when(submissionRepository.findByTeamIdAndRoundId(validTeamId, validRoundId))
                .thenReturn(Optional.empty());
        when(teamPublicService.isMentorOfTeam(JUDGE_ID, validTeamId)).thenReturn(false);

        List<JudgeScoringAssignmentResponse> result = judgingService.getMyScoringAssignments(JUDGE_ID);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getTeamId()).isEqualTo(validTeamId);
        assertThat(result.getFirst().getRoundId()).isEqualTo(validRoundId);
    }

    @Test
    void submitScore_shouldThrow_whenLockedOnResubmit() {
        setupValidContext();
        UUID scoreId = UUID.randomUUID();
        JudgeScore locked = JudgeScore.builder()
                .judgeUserId(JUDGE_ID).submissionId(SUBMISSION_ID).roundId(ROUND_ID)
                .status(ScoreStatus.LOCKED).startedAt(LocalDateTime.now())
                .build();
        locked.setId(scoreId);

        when(judgeScoreRepository.findByJudgeUserIdAndSubmissionId(JUDGE_ID, SUBMISSION_ID))
                .thenReturn(Optional.of(locked));

        ScoreSubmissionRequest request = buildRequest(7, 8, null, null);

        assertThatThrownBy(() -> judgingService.submitScore(JUDGE_ID, ROUND_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("locked");
    }

    private void setupValidContext() {
        when(eventPublicService.getScoringDeadline(ROUND_ID))
                .thenReturn(LocalDateTime.now().plusDays(1));
        when(submissionPublicService.getSubmission(SUBMISSION_ID))
                .thenReturn(Optional.of(SubmissionSnapshot.builder().id(SUBMISSION_ID).teamId(TEAM_ID).build()));
        Submission submission = Submission.builder()
                .teamId(TEAM_ID)
                .roundId(ROUND_ID)
                .build();
        submission.setId(SUBMISSION_ID);
        lenient().when(submissionRepository.findById(SUBMISSION_ID))
                .thenReturn(Optional.of(submission));
        when(teamJudgeAssignmentRepository.existsByTeamIdAndRoundIdAndJudgeUserId(TEAM_ID, ROUND_ID, JUDGE_ID))
                .thenReturn(true);
        when(eventPublicService.getCriteriaByRound(ROUND_ID)).thenReturn(List.of(
                CriteriaSnapshot.builder().id(CRITERIA_1).name("Technical").weight(50)
                        .minScore(0).maxScore(10).build(),
                CriteriaSnapshot.builder().id(CRITERIA_2).name("Innovation").weight(50)
                        .minScore(0).maxScore(10).build()
        ));
    }

    private ScoreSubmissionRequest buildRequest(int score1, int score2,
                                                 String comment1, String comment2) {
        return ScoreSubmissionRequest.builder()
                .submissionId(SUBMISSION_ID)
                .complete(true)
                .scores(List.of(
                        ScoreDetailDto.builder()
                                .criteriaId(CRITERIA_1).score(score1).comment(comment1).build(),
                        ScoreDetailDto.builder()
                                .criteriaId(CRITERIA_2).score(score2).comment(comment2).build()
                ))
                .build();
    }
}
