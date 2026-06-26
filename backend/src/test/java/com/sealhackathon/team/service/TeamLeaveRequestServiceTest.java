package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.LeaveRequestStatus;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.request.CreateLeaveRequestRequest;
import com.sealhackathon.team.repository.TeamLeaveRequestRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.repository.UserRepository;
import com.sealhackathon.user.service.UserPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamLeaveRequestServiceTest {

    @Mock private TeamLeaveRequestRepository leaveRequestRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private UserPublicService userPublicService;
    @Mock private UserRepository userRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private com.sealhackathon.common.service.SystemConfigService systemConfigService;

    @InjectMocks private TeamLeaveRequestService leaveRequestService;

    @Test
    void createLeaveRequest_shouldThrow_whenLeader() {
        UUID leaderId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Team team = Team.builder().eventId(eventId).name("T").leaderId(leaderId)
                .status(TeamStatus.FORMING).build();
        team.setId(teamId);

        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

        assertThatThrownBy(() -> leaveRequestService.createLeaveRequest(
                leaderId, eventId, teamId, new CreateLeaveRequestRequest()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("leader cannot");
    }

    @Test
    void createLeaveRequest_shouldThrow_whenDuplicatePending() {
        UUID userId = UUID.randomUUID();
        UUID leaderId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Team team = Team.builder().eventId(eventId).name("T").leaderId(leaderId)
                .status(TeamStatus.FORMING).build();
        team.setId(teamId);

        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId))
                .thenReturn(Optional.of(com.sealhackathon.team.domain.TeamMember.builder()
                        .team(team).userId(userId).build()));
        when(leaveRequestRepository.existsByTeamIdAndUserIdAndStatus(
                teamId, userId, LeaveRequestStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> leaveRequestService.createLeaveRequest(
                userId, eventId, teamId, new CreateLeaveRequestRequest()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("pending leave request");
    }
}
