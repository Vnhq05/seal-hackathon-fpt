package com.sealhackathon.team.service;

import com.sealhackathon.common.dto.SystemConfigResponse;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.service.SystemConfigService;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TeamJoinRequestServiceTest {

    @Mock private TeamJoinRequestRepository joinRequestRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private EventEnrollmentService enrollmentService;
    @Mock private SystemConfigService systemConfigService;
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
        when(teamMemberRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(true);

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
        when(teamMemberRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(false);
        when(joinRequestRepository.existsByRequesterIdAndEventIdAndStatus(
                userId, eventId, JoinRequestStatus.PENDING)).thenReturn(true);
        when(systemConfigService.getConfig()).thenReturn(SystemConfigResponse.builder()
                .minTeamMembers(3).maxTeamMembers(5).build());

        assertThatThrownBy(() -> joinRequestService.createJoinRequest(
                userId, eventId, teamId, new CreateJoinRequestRequest()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("pending join request");
    }
}
