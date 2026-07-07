package com.sealhackathon.event.service;

import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.AssignmentScope;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.request.AssignJudgeRequest;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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
    void assignJudge_shouldReject_whenJudgeIsMentorOfTeamInScope() {
        UUID eventId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        UUID trackId = UUID.randomUUID();
        UUID judgeUserId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Round round = preliminaryRound(roundId, eventId);
        Team team = Team.builder().eventId(eventId).name("Alpha").trackId(trackId).build();
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
        when(teamPublicService.isMentorOfTeam(judgeUserId, teamId)).thenReturn(true);

        assertThatThrownBy(() -> judgeAssignmentService.assignJudge(eventId, roundId, request, "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("mentor");

        verify(judgeAssignmentRepository, never()).save(any());
    }

    private Round preliminaryRound(UUID roundId, UUID eventId) {
        HackathonEvent event = HackathonEvent.builder().name("SEAL 2026").build();
        event.setId(eventId);
        Round round = Round.builder()
                .name("Preliminary")
                .roundType(RoundType.PRELIMINARY)
                .scoringDeadline(LocalDateTime.now().plusDays(7))
                .hackathonEvent(event)
                .build();
        round.setId(roundId);
        return round;
    }
}
