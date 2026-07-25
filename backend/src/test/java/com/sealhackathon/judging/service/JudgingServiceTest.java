package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.AssignmentScope;
import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.ranking.domain.FinalistSelection;
import com.sealhackathon.ranking.repository.FinalistSelectionRepository;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.event.service.JudgeAssignmentService;
import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.dto.request.ScoreDetailDto;
import com.sealhackathon.judging.dto.request.ScoreSubmissionRequest;
import com.sealhackathon.judging.dto.response.JudgeScoringAssignmentResponse;
import com.sealhackathon.judging.dto.response.JudgeScoreResponse;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.dto.snapshot.SubmissionSnapshot;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.service.FinalSubmissionCarryOverService;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JudgingServiceTest {

    @Mock private JudgeScoreRepository judgeScoreRepository;
    @Mock private JudgeAssignmentRepository judgeAssignmentRepository;
    @Mock private JudgeAssignmentService judgeAssignmentService;
    @Mock private SubmissionRepository submissionRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private HackathonEventRepository eventRepository;
    @Mock private TrackRepository trackRepository;
    @Mock private CompetitionGroupRepository competitionGroupRepository;
    @Mock private FormatRuleEngine formatRuleEngine;
    @Mock private PublishedResultRepository publishedResultRepository;
    @Mock private FinalistSelectionRepository finalistSelectionRepository;
    @Mock private ConflictDetectionService conflictDetectionService;
    @Mock private ScoreReviewService scoreReviewService;
    @Mock private EventPublicService eventPublicService;
    @Mock private SubmissionPublicService submissionPublicService;
    @Mock private FinalSubmissionCarryOverService finalSubmissionCarryOverService;
    @Mock private TeamPublicService teamPublicService;
    @Mock private UserPublicService userPublicService;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private JudgingService judgingService;

    private static final UUID JUDGE_ID = UUID.randomUUID();
    private static final UUID ROUND_ID = UUID.randomUUID();
    private static final UUID SUBMISSION_ID = UUID.randomUUID();
    private static final UUID TEAM_ID = UUID.randomUUID();
    private static final UUID TRACK_ID = UUID.randomUUID();
    private static final UUID EVENT_ID = UUID.randomUUID();
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
        Round round = Round.builder()
                .startDate(LocalDateTime.now().minusDays(2))
                .scoringDeadline(LocalDateTime.now().minusDays(1))
                .roundType(RoundType.PRELIMINARY)
                .build();
        round.setId(ROUND_ID);
        when(roundRepository.findById(ROUND_ID)).thenReturn(Optional.of(round));

        Submission submission = Submission.builder()
                .teamId(TEAM_ID)
                .roundId(ROUND_ID)
                .status(SubmissionStatus.SUBMITTED)
                .build();
        submission.setId(SUBMISSION_ID);
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));
        Team team = Team.builder().eventId(EVENT_ID).trackId(TRACK_ID).build();
        team.setId(TEAM_ID);
        when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));
        doNothing().when(formatRuleEngine).assertCanScore(EVENT_ID);
        when(scoreReviewService.isAdjustmentApproved(SUBMISSION_ID)).thenReturn(false);

        ScoreSubmissionRequest request = buildRequest(7, 8, null, null);

        assertThatThrownBy(() -> judgingService.submitScore(JUDGE_ID, ROUND_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("deadline");
    }

    @Test
    void submitScore_shouldSucceed_whenDeadlinePassedButAdjustmentApproved() {
        Round round = Round.builder()
                .startDate(LocalDateTime.now().minusDays(2))
                .scoringDeadline(LocalDateTime.now().minusDays(1))
                .roundType(RoundType.PRELIMINARY)
                .build();
        round.setId(ROUND_ID);
        when(roundRepository.findById(ROUND_ID)).thenReturn(Optional.of(round));

        Submission submission = Submission.builder()
                .teamId(TEAM_ID)
                .roundId(ROUND_ID)
                .status(SubmissionStatus.SUBMITTED)
                .build();
        submission.setId(SUBMISSION_ID);
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));
        when(submissionPublicService.getSubmission(SUBMISSION_ID))
                .thenReturn(Optional.of(SubmissionSnapshot.builder().id(SUBMISSION_ID).teamId(TEAM_ID).build()));

        Team team = Team.builder().eventId(EVENT_ID).trackId(TRACK_ID).build();
        team.setId(TEAM_ID);
        when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));

        doNothing().when(formatRuleEngine).assertCanScore(EVENT_ID);
        when(scoreReviewService.isAdjustmentApproved(SUBMISSION_ID)).thenReturn(true);
        when(publishedResultRepository.existsByRoundId(ROUND_ID)).thenReturn(false);
        when(finalistSelectionRepository.findByEventIdOrderByPreliminaryRankAsc(EVENT_ID))
                .thenReturn(List.of());
        when(judgeAssignmentService.isJudgeAssignedToSubmissionScope(
                ROUND_ID, JUDGE_ID, TRACK_ID, null)).thenReturn(true);
        doNothing().when(conflictDetectionService).checkConflict(JUDGE_ID, SUBMISSION_ID);

        when(eventPublicService.getCriteriaByRound(ROUND_ID)).thenReturn(List.of(
                CriteriaSnapshot.builder().id(CRITERIA_1).name("C1").weight(50)
                        .minScore(0).maxScore(10).build(),
                CriteriaSnapshot.builder().id(CRITERIA_2).name("C2").weight(50)
                        .minScore(0).maxScore(10).build()
        ));

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
    void submitScore_shouldThrow_whenNotAssigned() {
        Round round = Round.builder()
                .startDate(LocalDateTime.now().minusDays(1))
                .scoringDeadline(LocalDateTime.now().plusDays(1))
                .roundType(RoundType.PRELIMINARY)
                .build();
        round.setId(ROUND_ID);
        when(roundRepository.findById(ROUND_ID)).thenReturn(Optional.of(round));
        doNothing().when(formatRuleEngine).assertCanScore(EVENT_ID);
        when(publishedResultRepository.existsByRoundId(ROUND_ID)).thenReturn(false);
        when(finalistSelectionRepository.findByEventIdOrderByPreliminaryRankAsc(EVENT_ID))
                .thenReturn(List.of());

        Submission submission = Submission.builder()
                .teamId(TEAM_ID)
                .roundId(ROUND_ID)
                .status(SubmissionStatus.SUBMITTED)
                .build();
        submission.setId(SUBMISSION_ID);
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));

        when(submissionPublicService.getSubmission(SUBMISSION_ID))
                .thenReturn(Optional.of(SubmissionSnapshot.builder().id(SUBMISSION_ID).teamId(TEAM_ID).build()));
        Team team = Team.builder().eventId(EVENT_ID).trackId(TRACK_ID).build();
        team.setId(TEAM_ID);
        when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));
        when(judgeAssignmentService.isJudgeAssignedToSubmissionScope(
                ROUND_ID, JUDGE_ID, TRACK_ID, null)).thenReturn(false);

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
    void getMyScoringAssignments_shouldExpandFromPoolScope() {
        UUID validRoundId = UUID.randomUUID();
        UUID trackId = UUID.randomUUID();
        UUID validTeamId = UUID.randomUUID();
        UUID orphanTeamId = UUID.randomUUID();

        HackathonEvent event = HackathonEvent.builder().name("SEAL").build();
        event.setId(EVENT_ID);
        Round round = Round.builder()
                .name("Preliminary")
                .startDate(LocalDateTime.now().minusDays(1))
                .scoringDeadline(LocalDateTime.now().plusDays(1))
                .roundType(RoundType.PRELIMINARY)
                .hackathonEvent(event)
                .build();
        round.setId(validRoundId);

        JudgeAssignment poolAssignment = JudgeAssignment.builder()
                .round(round)
                .judgeUserId(JUDGE_ID)
                .scope(AssignmentScope.TRACK)
                .trackId(trackId)
                .active(true)
                .assignedAt(LocalDateTime.now())
                .build();

        Team validTeam = Team.builder().eventId(EVENT_ID).name("Team Alpha").trackId(trackId).build();
        validTeam.setId(validTeamId);
        Team orphanTeam = Team.builder().eventId(EVENT_ID).name("Orphan").trackId(trackId).build();
        orphanTeam.setId(orphanTeamId);

        when(judgeAssignmentRepository.findByJudgeUserId(JUDGE_ID))
                .thenReturn(List.of(poolAssignment));
        when(roundRepository.existsById(validRoundId)).thenReturn(true);
        when(teamRepository.findByEventIdAndTrackId(EVENT_ID, trackId))
                .thenReturn(List.of(validTeam, orphanTeam));
        when(teamRepository.existsById(validTeamId)).thenReturn(true);
        when(teamRepository.existsById(orphanTeamId)).thenReturn(false);

        when(teamRepository.findById(validTeamId)).thenReturn(Optional.of(validTeam));
        when(roundRepository.findById(validRoundId)).thenReturn(Optional.of(round));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
        when(submissionRepository.findByTeamIdAndRoundId(validTeamId, validRoundId))
                .thenReturn(Optional.empty());
        when(teamPublicService.isMentorOfTeam(JUDGE_ID, validTeamId)).thenReturn(false);
        when(conflictDetectionService.resolveConflictReason(eq(JUDGE_ID), any(Team.class)))
                .thenReturn(null);
        when(eventPublicService.getResolvedEventStatus(EVENT_ID)).thenReturn(EventStatus.SCORING);
        when(publishedResultRepository.existsByRoundId(validRoundId)).thenReturn(false);
        when(finalistSelectionRepository.findByEventIdOrderByPreliminaryRankAsc(EVENT_ID))
                .thenReturn(List.of());

        List<JudgeScoringAssignmentResponse> result = judgingService.getMyScoringAssignments(JUDGE_ID);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getTeamId()).isEqualTo(validTeamId);
        assertThat(result.getFirst().getRoundId()).isEqualTo(validRoundId);
    }

    @Test
    void getMyScoringAssignments_finalRound_shouldOnlyIncludeSelectedFinalists() {
        UUID finalRoundId = UUID.randomUUID();
        UUID finalistTeamId = UUID.randomUUID();
        UUID eliminatedTeamId = UUID.randomUUID();

        HackathonEvent event = HackathonEvent.builder().name("SEAL Final QA").build();
        event.setId(EVENT_ID);
        Round finalRound = Round.builder()
                .name("Finals")
                .startDate(LocalDateTime.now().minusDays(1))
                .scoringDeadline(LocalDateTime.now().plusDays(1))
                .roundType(RoundType.FINAL)
                .hackathonEvent(event)
                .build();
        finalRound.setId(finalRoundId);

        JudgeAssignment poolAssignment = JudgeAssignment.builder()
                .round(finalRound)
                .judgeUserId(JUDGE_ID)
                .scope(AssignmentScope.ROUND)
                .active(true)
                .assignedAt(LocalDateTime.now())
                .build();

        Team finalist = Team.builder().eventId(EVENT_ID).name("Finalist").build();
        finalist.setId(finalistTeamId);
        Team eliminated = Team.builder().eventId(EVENT_ID).name("Eliminated").build();
        eliminated.setId(eliminatedTeamId);

        FinalistSelection selection = FinalistSelection.builder()
                .eventId(EVENT_ID)
                .teamId(finalistTeamId)
                .preliminaryRank(1)
                .build();

        Submission carried = Submission.builder()
                .teamId(finalistTeamId)
                .roundId(finalRoundId)
                .status(SubmissionStatus.SUBMITTED)
                .build();
        carried.setId(UUID.randomUUID());

        when(judgeAssignmentRepository.findByJudgeUserId(JUDGE_ID))
                .thenReturn(List.of(poolAssignment));
        when(roundRepository.existsById(finalRoundId)).thenReturn(true);
        when(teamRepository.findByEventId(EVENT_ID)).thenReturn(List.of(finalist, eliminated));
        when(teamRepository.existsById(finalistTeamId)).thenReturn(true);
        when(finalistSelectionRepository.findByEventIdOrderByPreliminaryRankAsc(EVENT_ID))
                .thenReturn(List.of(selection));
        when(finalistSelectionRepository.existsByEventIdAndTeamId(EVENT_ID, finalistTeamId))
                .thenReturn(true);

        when(teamRepository.findById(finalistTeamId)).thenReturn(Optional.of(finalist));
        when(roundRepository.findById(finalRoundId)).thenReturn(Optional.of(finalRound));
        when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
        when(submissionRepository.findByTeamIdAndRoundId(finalistTeamId, finalRoundId))
                .thenReturn(Optional.of(carried));
        when(conflictDetectionService.resolveConflictReason(eq(JUDGE_ID), any(Team.class)))
                .thenReturn(null);
        when(eventPublicService.getResolvedEventStatus(EVENT_ID)).thenReturn(EventStatus.SCORING);
        when(publishedResultRepository.existsByRoundId(finalRoundId)).thenReturn(false);
        when(judgeAssignmentService.isJudgeAssignedToSubmissionScope(
                eq(finalRoundId), eq(JUDGE_ID), any(), any())).thenReturn(true);
        when(judgeScoreRepository.findByJudgeUserIdAndSubmissionId(eq(JUDGE_ID), any()))
                .thenReturn(Optional.empty());

        List<JudgeScoringAssignmentResponse> result = judgingService.getMyScoringAssignments(JUDGE_ID);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getTeamId()).isEqualTo(finalistTeamId);
    }

    @Test
    void getMyScoringAssignments_finalRound_shouldBeEmpty_beforeFinalistsSelected() {
        UUID finalRoundId = UUID.randomUUID();

        HackathonEvent event = HackathonEvent.builder().name("SEAL Final QA").build();
        event.setId(EVENT_ID);
        Round finalRound = Round.builder()
                .name("Finals")
                .startDate(LocalDateTime.now().minusDays(1))
                .scoringDeadline(LocalDateTime.now().plusDays(1))
                .roundType(RoundType.FINAL)
                .hackathonEvent(event)
                .build();
        finalRound.setId(finalRoundId);

        JudgeAssignment poolAssignment = JudgeAssignment.builder()
                .round(finalRound)
                .judgeUserId(JUDGE_ID)
                .scope(AssignmentScope.ROUND)
                .active(true)
                .assignedAt(LocalDateTime.now())
                .build();

        Team team = Team.builder().eventId(EVENT_ID).name("Team").build();
        team.setId(TEAM_ID);

        when(judgeAssignmentRepository.findByJudgeUserId(JUDGE_ID))
                .thenReturn(List.of(poolAssignment));
        when(roundRepository.existsById(finalRoundId)).thenReturn(true);
        when(teamRepository.findByEventId(EVENT_ID)).thenReturn(List.of(team));
        when(finalistSelectionRepository.findByEventIdOrderByPreliminaryRankAsc(EVENT_ID))
                .thenReturn(List.of());

        List<JudgeScoringAssignmentResponse> result = judgingService.getMyScoringAssignments(JUDGE_ID);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getTeamId()).isNull();
        assertThat(result.getFirst().getRoundName()).isEqualTo("Finals");
        assertThat(result.getFirst().isScoringAllowed()).isFalse();
    }

    @Test
    void submitScore_shouldThrow_whenEventNotInScoringPhase() {
        setupValidContext();
        org.mockito.Mockito.doThrow(new BusinessException("Event is not in SCORING phase", org.springframework.http.HttpStatus.BAD_REQUEST))
                .when(formatRuleEngine).assertCanScore(EVENT_ID);

        ScoreSubmissionRequest request = buildRequest(7, 8, null, null);

        assertThatThrownBy(() -> judgingService.submitScore(JUDGE_ID, ROUND_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("SCORING");
    }

    @Test
    void submitScore_shouldThrow_whenSubmissionNotSubmitted() {
        setupValidContext();
        Submission draft = Submission.builder()
                .teamId(TEAM_ID)
                .roundId(ROUND_ID)
                .status(SubmissionStatus.DRAFT)
                .build();
        draft.setId(SUBMISSION_ID);
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(draft));

        ScoreSubmissionRequest request = buildRequest(7, 8, null, null);

        assertThatThrownBy(() -> judgingService.submitScore(JUDGE_ID, ROUND_ID, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not submitted");
    }

    @Test
    void getScoresBySubmission_shouldReturnOnlyOwnScore_forLecturer() {
        UUID otherJudgeId = UUID.randomUUID();
        JudgeScore myScore = JudgeScore.builder()
                .judgeUserId(JUDGE_ID).submissionId(SUBMISSION_ID).roundId(ROUND_ID)
                .status(ScoreStatus.COMPLETED).startedAt(LocalDateTime.now())
                .build();
        myScore.setId(UUID.randomUUID());

        when(submissionPublicService.getSubmission(SUBMISSION_ID))
                .thenReturn(Optional.of(SubmissionSnapshot.builder().id(SUBMISSION_ID).teamId(TEAM_ID).build()));
        Team team = Team.builder().eventId(EVENT_ID).trackId(TRACK_ID).build();
        team.setId(TEAM_ID);
        when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));
        when(judgeAssignmentService.isJudgeAssignedToSubmissionScope(ROUND_ID, JUDGE_ID, TRACK_ID, null))
                .thenReturn(true);
        when(judgeScoreRepository.findByJudgeUserIdAndSubmissionId(JUDGE_ID, SUBMISSION_ID))
                .thenReturn(Optional.of(myScore));
        when(userPublicService.findById(JUDGE_ID))
                .thenReturn(Optional.of(UserSnapshot.builder().fullName("Judge").build()));
        when(eventPublicService.getCriteriaByRound(ROUND_ID)).thenReturn(List.of());

        List<JudgeScoreResponse> result = judgingService.getScoresBySubmission(
                SUBMISSION_ID, ROUND_ID, JUDGE_ID, com.sealhackathon.common.enums.UserType.LECTURER);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getJudgeUserId()).isEqualTo(JUDGE_ID);
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
        Round round = Round.builder()
                .name("Round 1")
                .startDate(LocalDateTime.now().minusDays(1))
                .scoringDeadline(LocalDateTime.now().plusDays(1))
                .roundType(RoundType.PRELIMINARY)
                .build();
        round.setId(ROUND_ID);

        when(roundRepository.findById(ROUND_ID)).thenReturn(Optional.of(round));
        when(eventPublicService.getScoringDeadline(ROUND_ID))
                .thenReturn(LocalDateTime.now().plusDays(1));
        when(eventPublicService.getResolvedEventStatus(EVENT_ID)).thenReturn(EventStatus.SCORING);
        doNothing().when(formatRuleEngine).assertCanScore(EVENT_ID);
        when(publishedResultRepository.existsByRoundId(ROUND_ID)).thenReturn(false);
        when(finalistSelectionRepository.findByEventIdOrderByPreliminaryRankAsc(EVENT_ID))
                .thenReturn(List.of());

        when(submissionPublicService.getSubmission(SUBMISSION_ID))
                .thenReturn(Optional.of(SubmissionSnapshot.builder()
                        .id(SUBMISSION_ID)
                        .teamId(TEAM_ID)
                        .roundId(ROUND_ID)
                        .status(SubmissionStatus.SUBMITTED)
                        .submittedAt(LocalDateTime.now())
                        .build()));
        Submission submission = Submission.builder()
                .teamId(TEAM_ID)
                .roundId(ROUND_ID)
                .status(SubmissionStatus.SUBMITTED)
                .build();
        submission.setId(SUBMISSION_ID);
        when(submissionRepository.findById(SUBMISSION_ID))
                .thenReturn(Optional.of(submission));
        Team team = Team.builder().eventId(EVENT_ID).trackId(TRACK_ID).build();
        team.setId(TEAM_ID);
        when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));
        when(judgeAssignmentService.isJudgeAssignedToSubmissionScope(
                ROUND_ID, JUDGE_ID, TRACK_ID, null)).thenReturn(true);
        lenient().doNothing().when(conflictDetectionService).checkConflict(JUDGE_ID, SUBMISSION_ID);
        when(eventPublicService.getCriteriaByRound(ROUND_ID)).thenReturn(List.of(
                CriteriaSnapshot.builder().id(CRITERIA_1).name("Technical").weight(50)
                        .minScore(0).maxScore(10).build(),
                CriteriaSnapshot.builder().id(CRITERIA_2).name("Innovation").weight(50)
                        .minScore(0).maxScore(10).build()
        ));
        lenient().when(judgeAssignmentService.getEligibleJudgeUserIds(eq(ROUND_ID), eq(TRACK_ID), eq(null)))
                .thenReturn(List.of(JUDGE_ID));
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
