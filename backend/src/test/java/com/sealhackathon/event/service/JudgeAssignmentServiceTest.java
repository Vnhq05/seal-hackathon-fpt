package com.sealhackathon.event.service;

import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.CompetitionGroup;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.AssignmentScope;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.request.AssignJudgeRequest;
import com.sealhackathon.event.dto.response.JudgeAssignmentResponse;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.event.repository.MentorAssignmentRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.notification.service.NotificationService;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.repository.TeamMemberRepository;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JudgeAssignmentServiceTest {

    @Mock private JudgeAssignmentRepository judgeAssignmentRepository;
    @Mock private JudgeScoreRepository judgeScoreRepository;
    @Mock private SubmissionRepository submissionRepository;
    @Mock private RoundService roundService;
    @Mock private EventJudgeService eventJudgeService;
    @Mock private TrackRepository trackRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private CompetitionGroupRepository competitionGroupRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private TeamPublicService teamPublicService;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private MentorAssignmentRepository mentorAssignmentRepository;
    @Mock private UserPublicService userPublicService;
    @Mock private PublishedResultRepository publishedResultRepository;
    @Mock private AuditService auditService;
    @Mock private AuthPublicService authPublicService;
    @Mock private NotificationService notificationService;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private JudgeAssignmentService judgeAssignmentService;

    @Test
    void isJudgeAssignedToSubmissionScope_shouldReturnTrue_forRoundScope() {
        UUID roundId = UUID.randomUUID();
        UUID judgeUserId = UUID.randomUUID();
        UUID teamTrackId = UUID.randomUUID();

        JudgeAssignment assignment = JudgeAssignment.builder()
                .scope(AssignmentScope.ROUND)
                .judgeUserId(judgeUserId)
                .active(true)
                .build();

        when(judgeAssignmentRepository.findByRoundIdAndJudgeUserIdAndActiveTrue(roundId, judgeUserId))
                .thenReturn(List.of(assignment));

        assertThat(judgeAssignmentService.isJudgeAssignedToSubmissionScope(
                roundId, judgeUserId, teamTrackId, null)).isTrue();
    }

    @Test
    void isJudgeAssignedToSubmissionScope_shouldReturnTrue_forMatchingGroup() {
        UUID roundId = UUID.randomUUID();
        UUID judgeUserId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();

        JudgeAssignment assignment = JudgeAssignment.builder()
                .scope(AssignmentScope.GROUP)
                .groupId(groupId)
                .trackId(UUID.randomUUID())
                .judgeUserId(judgeUserId)
                .active(true)
                .build();

        when(judgeAssignmentRepository.findByRoundIdAndJudgeUserIdAndActiveTrue(roundId, judgeUserId))
                .thenReturn(List.of(assignment));

        assertThat(judgeAssignmentService.isJudgeAssignedToSubmissionScope(
                roundId, judgeUserId, UUID.randomUUID(), groupId)).isTrue();
    }

    @Test
    void assignJudge_shouldReject_whenJudgeIsMentorOfTrack() {
        UUID eventId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        UUID trackId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        UUID judgeUserId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Round round = preliminaryRound(roundId, eventId);
        Team team = Team.builder()
                .eventId(eventId)
                .name("QA Team 05")
                .trackId(trackId)
                .groupId(groupId)
                .build();
        team.setId(teamId);

        Track track = Track.builder().name("Track A").hackathonEvent(round.getHackathonEvent()).build();
        track.setId(trackId);

        AssignJudgeRequest request = AssignJudgeRequest.builder()
                .judgeUserId(judgeUserId)
                .scope(AssignmentScope.TRACK)
                .trackId(trackId)
                .build();

        when(roundService.getRound(roundId)).thenReturn(round);
        when(publishedResultRepository.existsByRoundId(roundId)).thenReturn(false);
        when(userPublicService.findById(judgeUserId)).thenReturn(Optional.of(
                UserSnapshot.builder().userType(UserType.LECTURER).email("judge@fpt.edu.vn").build()));
        when(eventJudgeService.isEventJudge(eventId, judgeUserId)).thenReturn(true);
        when(trackRepository.findById(trackId)).thenReturn(Optional.of(track));
        when(judgeAssignmentRepository.findByRoundIdAndJudgeUserIdAndActiveTrue(roundId, judgeUserId))
                .thenReturn(List.of());
        when(teamRepository.findByEventIdAndTrackId(eventId, trackId)).thenReturn(List.of(team));
        when(mentorAssignmentRepository.existsByHackathonEventIdAndTrackIdAndMentorUserId(
                eventId, trackId, judgeUserId)).thenReturn(true);

        assertThatThrownBy(() -> judgeAssignmentService.assignJudge(eventId, roundId, request, "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("mentor of this track");
        verify(judgeAssignmentRepository, never()).save(any());
    }

    @Test
    void assignJudge_shouldAllow_whenJudgeDoesNotMentorTrack() {
        UUID eventId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        UUID trackId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        UUID judgeUserId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Round round = preliminaryRound(roundId, eventId);
        Team team = Team.builder()
                .eventId(eventId)
                .name("QA Team 05")
                .trackId(trackId)
                .groupId(groupId)
                .build();
        team.setId(teamId);

        Track track = Track.builder().name("Track A").hackathonEvent(round.getHackathonEvent()).build();
        track.setId(trackId);

        AssignJudgeRequest request = AssignJudgeRequest.builder()
                .judgeUserId(judgeUserId)
                .scope(AssignmentScope.TRACK)
                .trackId(trackId)
                .build();

        when(roundService.getRound(roundId)).thenReturn(round);
        when(publishedResultRepository.existsByRoundId(roundId)).thenReturn(false);
        when(userPublicService.findById(judgeUserId)).thenReturn(Optional.of(
                UserSnapshot.builder().userType(UserType.LECTURER).email("judge@fpt.edu.vn").build()));
        when(eventJudgeService.isEventJudge(eventId, judgeUserId)).thenReturn(true);
        when(trackRepository.findById(trackId)).thenReturn(Optional.of(track));
        when(judgeAssignmentRepository.findByRoundIdAndJudgeUserIdAndActiveTrue(roundId, judgeUserId))
                .thenReturn(List.of());
        when(teamRepository.findByEventIdAndTrackId(eventId, trackId)).thenReturn(List.of(team));
        when(mentorAssignmentRepository.existsByHackathonEventIdAndTrackIdAndMentorUserId(
                eventId, trackId, judgeUserId)).thenReturn(false);
        when(judgeAssignmentRepository.save(any(JudgeAssignment.class))).thenAnswer(invocation -> {
            JudgeAssignment saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        when(authPublicService.getCurrentUserId()).thenReturn(UUID.randomUUID());

        JudgeAssignmentResponse response =
                judgeAssignmentService.assignJudge(eventId, roundId, request, "127.0.0.1");

        assertThat(response.getJudgeUserId()).isEqualTo(judgeUserId);
        verify(judgeAssignmentRepository).save(any(JudgeAssignment.class));
    }

    @Test
    void assignJudge_shouldAllow_whenTeamHasNoCompetitionGroup() {
        UUID eventId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        UUID trackId = UUID.randomUUID();
        UUID judgeUserId = UUID.randomUUID();
        Round round = preliminaryRound(roundId, eventId);
        Team team = Team.builder().eventId(eventId).name("Ungrouped").trackId(trackId).build();
        team.setId(UUID.randomUUID());
        Track track = Track.builder().name("Track A").hackathonEvent(round.getHackathonEvent()).build();
        track.setId(trackId);

        AssignJudgeRequest request = AssignJudgeRequest.builder()
                .judgeUserId(judgeUserId)
                .scope(AssignmentScope.TRACK)
                .trackId(trackId)
                .build();

        when(roundService.getRound(roundId)).thenReturn(round);
        when(publishedResultRepository.existsByRoundId(roundId)).thenReturn(false);
        when(userPublicService.findById(judgeUserId)).thenReturn(Optional.of(
                UserSnapshot.builder().userType(UserType.LECTURER).email("judge@fpt.edu.vn").build()));
        when(eventJudgeService.isEventJudge(eventId, judgeUserId)).thenReturn(true);
        when(trackRepository.findById(trackId)).thenReturn(Optional.of(track));
        when(judgeAssignmentRepository.findByRoundIdAndJudgeUserIdAndActiveTrue(roundId, judgeUserId))
                .thenReturn(List.of());
        when(teamRepository.findByEventIdAndTrackId(eventId, trackId)).thenReturn(List.of(team));
        when(mentorAssignmentRepository.existsByHackathonEventIdAndTrackIdAndMentorUserId(
                eventId, trackId, judgeUserId)).thenReturn(false);
        when(judgeAssignmentRepository.save(any(JudgeAssignment.class))).thenAnswer(invocation -> {
            JudgeAssignment saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        when(authPublicService.getCurrentUserId()).thenReturn(UUID.randomUUID());

        JudgeAssignmentResponse response =
                judgeAssignmentService.assignJudge(eventId, roundId, request, "127.0.0.1");

        assertThat(response.getJudgeUserId()).isEqualTo(judgeUserId);
        verify(judgeAssignmentRepository).save(any(JudgeAssignment.class));
    }

    @Test
    void assignJudge_shouldReject_whenFinalJudgeAlreadyAssignedInPriorRound() {
        UUID eventId = UUID.randomUUID();
        UUID finalRoundId = UUID.randomUUID();
        UUID judgeUserId = UUID.randomUUID();
        Round finalRound = finalRound(finalRoundId, eventId);
        Team team = Team.builder().eventId(eventId).name("Finalist").groupId(UUID.randomUUID()).build();
        team.setId(UUID.randomUUID());

        when(roundService.getRound(finalRoundId)).thenReturn(finalRound);
        when(publishedResultRepository.existsByRoundId(finalRoundId)).thenReturn(false);
        when(userPublicService.findById(judgeUserId)).thenReturn(Optional.of(
                UserSnapshot.builder().userType(UserType.LECTURER).email("judge@fpt.edu.vn").build()));
        when(eventJudgeService.isEventJudge(eventId, judgeUserId)).thenReturn(true);
        when(teamRepository.findByEventId(eventId)).thenReturn(List.of(team));
        when(judgeAssignmentRepository.existsPriorAssignmentInEvent(judgeUserId, eventId, finalRoundId))
                .thenReturn(true);

        AssignJudgeRequest request = AssignJudgeRequest.builder()
                .judgeUserId(judgeUserId)
                .scope(AssignmentScope.ROUND)
                .build();

        assertThatThrownBy(() -> judgeAssignmentService.assignJudge(eventId, finalRoundId, request, "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("must not have judged any track, group, or round earlier");
        verify(judgeAssignmentRepository, never()).save(any());
    }

    @Test
    void assignJudge_shouldReject_whenFinalJudgeAlreadyScoredInPriorRound() {
        UUID eventId = UUID.randomUUID();
        UUID finalRoundId = UUID.randomUUID();
        UUID judgeUserId = UUID.randomUUID();
        Round finalRound = finalRound(finalRoundId, eventId);
        Team team = Team.builder().eventId(eventId).name("Finalist").groupId(UUID.randomUUID()).build();
        team.setId(UUID.randomUUID());

        when(roundService.getRound(finalRoundId)).thenReturn(finalRound);
        when(publishedResultRepository.existsByRoundId(finalRoundId)).thenReturn(false);
        when(userPublicService.findById(judgeUserId)).thenReturn(Optional.of(
                UserSnapshot.builder().userType(UserType.LECTURER).email("judge@fpt.edu.vn").build()));
        when(eventJudgeService.isEventJudge(eventId, judgeUserId)).thenReturn(true);
        when(teamRepository.findByEventId(eventId)).thenReturn(List.of(team));
        when(judgeAssignmentRepository.existsPriorAssignmentInEvent(judgeUserId, eventId, finalRoundId))
                .thenReturn(false);
        when(judgeScoreRepository.existsPriorScoreInEvent(judgeUserId, eventId, finalRoundId))
                .thenReturn(true);

        AssignJudgeRequest request = AssignJudgeRequest.builder()
                .judgeUserId(judgeUserId)
                .scope(AssignmentScope.ROUND)
                .build();

        assertThatThrownBy(() -> judgeAssignmentService.assignJudge(eventId, finalRoundId, request, "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("must not have judged any track, group, or round earlier");
        verify(judgeAssignmentRepository, never()).save(any());
    }

    @Test
    void assignJudge_shouldAllow_whenFinalJudgeHasNoPriorRoundHistory() {
        UUID eventId = UUID.randomUUID();
        UUID finalRoundId = UUID.randomUUID();
        UUID judgeUserId = UUID.randomUUID();
        Round finalRound = finalRound(finalRoundId, eventId);
        Team team = Team.builder().eventId(eventId).name("Finalist").groupId(UUID.randomUUID()).build();
        team.setId(UUID.randomUUID());

        when(roundService.getRound(finalRoundId)).thenReturn(finalRound);
        when(publishedResultRepository.existsByRoundId(finalRoundId)).thenReturn(false);
        when(userPublicService.findById(judgeUserId)).thenReturn(Optional.of(
                UserSnapshot.builder().userType(UserType.LECTURER).email("fresh@fpt.edu.vn").build()));
        when(eventJudgeService.isEventJudge(eventId, judgeUserId)).thenReturn(true);
        when(teamRepository.findByEventId(eventId)).thenReturn(List.of(team));
        when(judgeAssignmentRepository.existsPriorAssignmentInEvent(judgeUserId, eventId, finalRoundId))
                .thenReturn(false);
        when(judgeScoreRepository.existsPriorScoreInEvent(judgeUserId, eventId, finalRoundId))
                .thenReturn(false);
        when(judgeAssignmentRepository.findByRoundIdAndJudgeUserIdAndActiveTrue(finalRoundId, judgeUserId))
                .thenReturn(List.of());
        when(mentorAssignmentRepository.findByHackathonEventId(eventId)).thenReturn(List.of());
        when(teamMemberRepository.existsByTeamIdAndUserId(team.getId(), judgeUserId)).thenReturn(false);
        when(judgeAssignmentRepository.save(any(JudgeAssignment.class))).thenAnswer(invocation -> {
            JudgeAssignment saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        when(authPublicService.getCurrentUserId()).thenReturn(UUID.randomUUID());

        AssignJudgeRequest request = AssignJudgeRequest.builder()
                .judgeUserId(judgeUserId)
                .scope(AssignmentScope.ROUND)
                .build();

        JudgeAssignmentResponse response =
                judgeAssignmentService.assignJudge(eventId, finalRoundId, request, "127.0.0.1");

        assertThat(response.getJudgeUserId()).isEqualTo(judgeUserId);
        verify(judgeAssignmentRepository).save(any(JudgeAssignment.class));
    }

    @Test
    void computeIncompleteScopes_shouldUseEffectiveJudgeCountPerTeam() {
        UUID eventId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        UUID trackId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID mentorJudgeId = UUID.randomUUID();
        UUID eligibleJudgeId = UUID.randomUUID();
        Round round = preliminaryRound(roundId, eventId);

        Track track = Track.builder().name("Track A").hackathonEvent(round.getHackathonEvent()).build();
        track.setId(trackId);
        CompetitionGroup group = CompetitionGroup.builder()
                .trackId(trackId)
                .name("Group A")
                .build();
        group.setId(groupId);
        Team team = Team.builder()
                .eventId(eventId)
                .name("Alpha")
                .trackId(trackId)
                .groupId(groupId)
                .build();
        team.setId(teamId);

        JudgeAssignment mentorAssignment = JudgeAssignment.builder()
                .round(round)
                .judgeUserId(mentorJudgeId)
                .scope(AssignmentScope.GROUP)
                .trackId(trackId)
                .groupId(groupId)
                .active(true)
                .build();
        JudgeAssignment eligibleAssignment = JudgeAssignment.builder()
                .round(round)
                .judgeUserId(eligibleJudgeId)
                .scope(AssignmentScope.GROUP)
                .trackId(trackId)
                .groupId(groupId)
                .active(true)
                .build();

        when(trackRepository.findByHackathonEventId(eventId)).thenReturn(List.of(track));
        when(competitionGroupRepository.findByTrackIdOrderByNameAsc(trackId)).thenReturn(List.of(group));
        when(teamRepository.findByEventIdAndGroupId(eventId, groupId)).thenReturn(List.of(team));
        when(judgeAssignmentRepository.findByRoundIdAndActiveTrue(roundId))
                .thenReturn(List.of(mentorAssignment, eligibleAssignment));
        when(teamPublicService.isMentorOfTeam(mentorJudgeId, teamId)).thenReturn(true);

        var incomplete = judgeAssignmentService.computeIncompleteScopes(round);

        assertThat(incomplete).hasSize(1);
        assertThat(incomplete.getFirst().getGroupId()).isEqualTo(groupId);
        assertThat(incomplete.getFirst().getJudgeCount()).isEqualTo(1);
        assertThat(incomplete.getFirst().getMinJudgesRequired()).isEqualTo(2);
    }

    @Test
    void deactivateAssignmentsForDeletedGroup_shouldDeactivateAndNotify_forEachAssignment() {
        UUID groupId = UUID.randomUUID();
        UUID judgeUserId = UUID.randomUUID();
        Round round = preliminaryRound(UUID.randomUUID(), UUID.randomUUID());

        JudgeAssignment assignment = JudgeAssignment.builder()
                .scope(AssignmentScope.GROUP)
                .groupId(groupId)
                .trackId(UUID.randomUUID())
                .judgeUserId(judgeUserId)
                .round(round)
                .assignedAt(LocalDateTime.now())
                .active(true)
                .build();
        assignment.setId(UUID.randomUUID());

        when(judgeAssignmentRepository.findByGroupIdAndActiveTrue(groupId)).thenReturn(List.of(assignment));

        judgeAssignmentService.deactivateAssignmentsForDeletedGroup(groupId, "127.0.0.1");

        assertThat(assignment.isActive()).isFalse();
        assertThat(assignment.getDeactivatedAt()).isNotNull();
        assertThat(assignment.getDeactivationReason()).isEqualTo("Competition group deleted");
        verify(judgeAssignmentRepository).save(assignment);
        verify(notificationService).createNotification(
                any(), any(), any(), eq(assignment.getId()), eq("JudgeAssignment"), eq(List.of(judgeUserId)));
    }

    @Test
    void deactivateAssignmentsForDeletedGroup_shouldDoNothing_whenGroupHasNoAssignments() {
        UUID groupId = UUID.randomUUID();
        when(judgeAssignmentRepository.findByGroupIdAndActiveTrue(groupId)).thenReturn(List.of());

        judgeAssignmentService.deactivateAssignmentsForDeletedGroup(groupId, "127.0.0.1");

        verify(judgeAssignmentRepository, never()).save(any());
        verifyNoInteractions(notificationService);
    }

    @Test
    void assignJudge_final_shouldReject_whenJudgeHasPriorRoundAssignment() {
        UUID eventId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        UUID judgeUserId = UUID.randomUUID();

        HackathonEvent event = HackathonEvent.builder().name("SEAL Final QA").build();
        event.setId(eventId);
        Round finalRound = Round.builder()
                .name("Finals")
                .roundType(RoundType.FINAL)
                .startDate(LocalDateTime.now().plusDays(1))
                .scoringDeadline(LocalDateTime.now().plusDays(7))
                .hackathonEvent(event)
                .build();
        finalRound.setId(roundId);

        AssignJudgeRequest request = AssignJudgeRequest.builder()
                .judgeUserId(judgeUserId)
                .scope(AssignmentScope.ROUND)
                .build();

        when(roundService.getRound(roundId)).thenReturn(finalRound);
        when(publishedResultRepository.existsByRoundId(roundId)).thenReturn(false);
        when(userPublicService.findById(judgeUserId)).thenReturn(Optional.of(
                UserSnapshot.builder().userType(UserType.LECTURER).email("guest@fpt.edu.vn").build()));
        when(eventJudgeService.isEventJudge(eventId, judgeUserId)).thenReturn(true);
        when(teamRepository.findByEventId(eventId)).thenReturn(List.of());
        when(judgeAssignmentRepository.findByRoundIdAndJudgeUserIdAndActiveTrue(roundId, judgeUserId))
                .thenReturn(List.of());
        when(mentorAssignmentRepository.findByHackathonEventId(eventId)).thenReturn(List.of());
        when(judgeAssignmentRepository.existsActiveNonFinalAssignmentInEvent(
                judgeUserId, eventId, RoundType.FINAL)).thenReturn(true);

        assertThatThrownBy(() -> judgeAssignmentService.assignJudge(eventId, roundId, request, "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("prior round");
        verify(judgeAssignmentRepository, never()).save(any());
    }

    @Test
    void assignJudge_final_shouldReject_whenJudgeHasPriorRoundScore() {
        UUID eventId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        UUID judgeUserId = UUID.randomUUID();

        HackathonEvent event = HackathonEvent.builder().name("SEAL Final QA").build();
        event.setId(eventId);
        Round finalRound = Round.builder()
                .name("Finals")
                .roundType(RoundType.FINAL)
                .startDate(LocalDateTime.now().plusDays(1))
                .scoringDeadline(LocalDateTime.now().plusDays(7))
                .hackathonEvent(event)
                .build();
        finalRound.setId(roundId);

        AssignJudgeRequest request = AssignJudgeRequest.builder()
                .judgeUserId(judgeUserId)
                .scope(AssignmentScope.ROUND)
                .build();

        when(roundService.getRound(roundId)).thenReturn(finalRound);
        when(publishedResultRepository.existsByRoundId(roundId)).thenReturn(false);
        when(userPublicService.findById(judgeUserId)).thenReturn(Optional.of(
                UserSnapshot.builder().userType(UserType.LECTURER).email("guest@fpt.edu.vn").build()));
        when(eventJudgeService.isEventJudge(eventId, judgeUserId)).thenReturn(true);
        when(teamRepository.findByEventId(eventId)).thenReturn(List.of());
        when(judgeAssignmentRepository.findByRoundIdAndJudgeUserIdAndActiveTrue(roundId, judgeUserId))
                .thenReturn(List.of());
        when(mentorAssignmentRepository.findByHackathonEventId(eventId)).thenReturn(List.of());
        when(judgeAssignmentRepository.existsActiveNonFinalAssignmentInEvent(
                judgeUserId, eventId, RoundType.FINAL)).thenReturn(false);
        when(judgeScoreRepository.existsScoreOnNonFinalRoundInEvent(
                judgeUserId, eventId, RoundType.FINAL)).thenReturn(true);

        assertThatThrownBy(() -> judgeAssignmentService.assignJudge(eventId, roundId, request, "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("scored any prior round");
        verify(judgeAssignmentRepository, never()).save(any());
    }

    private Round preliminaryRound(UUID roundId, UUID eventId) {
        HackathonEvent event = HackathonEvent.builder().name("SEAL 2026").build();
        event.setId(eventId);
        Round round = Round.builder()
                .name("Preliminary")
                .roundType(RoundType.PRELIMINARY)
                .startDate(LocalDateTime.now().plusDays(1))
                .scoringDeadline(LocalDateTime.now().plusDays(7))
                .hackathonEvent(event)
                .build();
        round.setId(roundId);
        return round;
    }

    private Round finalRound(UUID roundId, UUID eventId) {
        HackathonEvent event = HackathonEvent.builder().name("SEAL 2026").build();
        event.setId(eventId);
        Round round = Round.builder()
                .name("Final")
                .roundType(RoundType.FINAL)
                .startDate(LocalDateTime.now().plusDays(8))
                .scoringDeadline(LocalDateTime.now().plusDays(14))
                .hackathonEvent(event)
                .build();
        round.setId(roundId);
        return round;
    }
}
