package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamJoinRequest;
import com.sealhackathon.team.domain.enums.JoinRequestStatus;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.request.CreateJoinRequestRequest;
import com.sealhackathon.team.repository.TeamJoinRequestRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.service.UserPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TeamJoinRequestServiceTest {

    @Mock private TeamJoinRequestRepository joinRequestRepository;
    @Mock private JoinRequestStatusService joinRequestStatusService;
    @Mock private InvitationStatusService invitationStatusService;
    @Mock private TeamCapacityCleanup teamCapacityCleanup;
    @Mock private TeamRepository teamRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private EventEnrollmentService enrollmentService;
    @Mock private UserPublicService userPublicService;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private TeamService teamService;

    @InjectMocks private TeamJoinRequestService joinRequestService;

    @Test
    void createJoinRequest_shouldThrow_whenAlreadyInTeam() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Team team = Team.builder().eventId(eventId).name("T").leaderId(UUID.randomUUID())
                .status(TeamStatus.FORMING).build();
        team.setId(teamId);

        when(teamRepository.findByIdForUpdate(teamId)).thenReturn(Optional.of(team));
        doNothing().when(teamService).validateTeamFormationAllowed(eventId);
        doNothing().when(teamService).validateRegistrationOpen(eventId);
        doNothing().when(enrollmentService).requireApprovedEnrollment(userId, eventId);
        when(teamMemberRepository.existsActiveByUserIdAndEventId(userId, eventId)).thenReturn(true);

        assertThatThrownBy(() -> joinRequestService.createJoinRequest(
                userId, eventId, teamId, new CreateJoinRequestRequest()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already a member");
    }

    @Test
    void createJoinRequest_shouldThrow_whenPendingExists() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Team team = Team.builder().eventId(eventId).name("T").leaderId(UUID.randomUUID())
                .status(TeamStatus.FORMING).build();
        team.setId(teamId);

        when(teamRepository.findByIdForUpdate(teamId)).thenReturn(Optional.of(team));
        doNothing().when(teamService).validateTeamFormationAllowed(eventId);
        doNothing().when(teamService).validateRegistrationOpen(eventId);
        doNothing().when(enrollmentService).requireApprovedEnrollment(userId, eventId);
        when(teamMemberRepository.existsActiveByUserIdAndEventId(userId, eventId)).thenReturn(false);
        when(joinRequestRepository.existsByRequesterIdAndEventIdAndStatus(
                userId, eventId, JoinRequestStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> joinRequestService.createJoinRequest(
                userId, eventId, teamId, new CreateJoinRequestRequest()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("pending join request");
    }

    @Test
    void createJoinRequest_shouldThrow_whenTeamFull() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Team team = Team.builder().eventId(eventId).name("T").leaderId(UUID.randomUUID())
                .status(TeamStatus.FORMING).build();
        team.setId(teamId);

        when(teamRepository.findByIdForUpdate(teamId)).thenReturn(Optional.of(team));
        doNothing().when(teamService).validateTeamFormationAllowed(eventId);
        doNothing().when(teamService).validateRegistrationOpen(eventId);
        doNothing().when(enrollmentService).requireApprovedEnrollment(userId, eventId);
        when(teamMemberRepository.existsActiveByUserIdAndEventId(userId, eventId)).thenReturn(false);
        when(joinRequestRepository.existsByRequesterIdAndEventIdAndStatus(
                userId, eventId, JoinRequestStatus.PENDING)).thenReturn(false);
        when(teamService.resolveMaxTeamMembers(eventId)).thenReturn(5);
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(5);

        assertThatThrownBy(() -> joinRequestService.createJoinRequest(
                userId, eventId, teamId, new CreateJoinRequestRequest()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("maximum number of members");
    }

    @Test
    void acceptJoinRequest_shouldRetirePending_whenTeamAlreadyFull() {
        UUID leaderId = UUID.randomUUID();
        UUID requesterId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID joinRequestId = UUID.randomUUID();

        Team team = Team.builder().eventId(eventId).name("T").leaderId(leaderId)
                .status(TeamStatus.FORMING).build();
        team.setId(teamId);

        TeamJoinRequest joinRequest = TeamJoinRequest.builder()
                .team(team)
                .eventId(eventId)
                .requesterId(requesterId)
                .status(JoinRequestStatus.PENDING)
                .build();
        joinRequest.setId(joinRequestId);

        when(joinRequestRepository.findByIdAndEventId(joinRequestId, eventId))
                .thenReturn(Optional.of(joinRequest));
        when(teamRepository.findByIdForUpdate(teamId)).thenReturn(Optional.of(team));
        doNothing().when(teamService).validateMemberChangesAllowed(eventId);
        when(teamMemberRepository.existsActiveByUserIdAndEventId(requesterId, eventId)).thenReturn(false);
        when(teamMemberRepository.findByUserIdAndEventId(requesterId, eventId)).thenReturn(Optional.empty());
        when(teamService.resolveMaxTeamMembers(eventId)).thenReturn(5);
        when(teamService.resolveMinTeamMembers(eventId)).thenReturn(3);
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(5);

        assertThatThrownBy(() -> joinRequestService.acceptJoinRequest(leaderId, eventId, joinRequestId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("maximum number of members");

        verify(teamCapacityCleanup).expirePendingAfterUnlock(teamId);
        verify(teamMemberRepository, never()).save(any());
    }
}
