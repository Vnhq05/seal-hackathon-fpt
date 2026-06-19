package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.team.domain.Invitation;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.InvitationStatus;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.request.SendInvitationRequest;
import com.sealhackathon.team.dto.response.InvitationResponse;
import com.sealhackathon.team.repository.InvitationRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @Mock private InvitationRepository invitationRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private UserPublicService userPublicService;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private InvitationService invitationService;

    @Test
    void sendInvitation_shouldSucceed() {
        UUID leaderId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID inviteeId = UUID.randomUUID();

        Team team = buildTeam(teamId, eventId, leaderId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(2);
        when(invitationRepository.existsByTeamIdAndInviteeEmailAndStatus(
                teamId, "invitee@test.com", InvitationStatus.PENDING)).thenReturn(false);
        when(userPublicService.findByEmail("invitee@test.com"))
                .thenReturn(Optional.of(UserSnapshot.builder().id(inviteeId).email("invitee@test.com").build()));
        when(teamMemberRepository.existsByUserIdAndEventId(inviteeId, eventId)).thenReturn(false);
        when(invitationRepository.save(any(Invitation.class))).thenAnswer(i -> {
            Invitation inv = i.getArgument(0);
            inv.setId(UUID.randomUUID());
            return inv;
        });

        SendInvitationRequest request = SendInvitationRequest.builder()
                .inviteeEmail("invitee@test.com").build();

        InvitationResponse result = invitationService.sendInvitation(leaderId, teamId, request);

        assertThat(result.getInviteeEmail()).isEqualTo("invitee@test.com");
        assertThat(result.getStatus()).isEqualTo(InvitationStatus.PENDING);
    }

    @Test
    void sendInvitation_shouldThrow_whenNotLeader() {
        UUID notLeader = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Team team = buildTeam(teamId, UUID.randomUUID(), UUID.randomUUID());
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

        SendInvitationRequest request = SendInvitationRequest.builder()
                .inviteeEmail("x@test.com").build();

        assertThatThrownBy(() -> invitationService.sendInvitation(notLeader, teamId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("leader");
    }

    @Test
    void sendInvitation_shouldThrow_whenTeamFull() {
        UUID leaderId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Team team = buildTeam(teamId, UUID.randomUUID(), leaderId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(5);

        SendInvitationRequest request = SendInvitationRequest.builder()
                .inviteeEmail("x@test.com").build();

        assertThatThrownBy(() -> invitationService.sendInvitation(leaderId, teamId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("full");
    }

    @Test
    void sendInvitation_shouldThrow_whenDuplicatePending() {
        UUID leaderId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Team team = buildTeam(teamId, UUID.randomUUID(), leaderId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(2);
        when(invitationRepository.existsByTeamIdAndInviteeEmailAndStatus(
                teamId, "dup@test.com", InvitationStatus.PENDING)).thenReturn(true);

        SendInvitationRequest request = SendInvitationRequest.builder()
                .inviteeEmail("dup@test.com").build();

        assertThatThrownBy(() -> invitationService.sendInvitation(leaderId, teamId, request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void acceptInvitation_shouldThrow_whenExpired() {
        UUID userId = UUID.randomUUID();
        UUID invitationId = UUID.randomUUID();
        Team team = buildTeam(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());

        Invitation invitation = Invitation.builder()
                .team(team)
                .inviterId(UUID.randomUUID())
                .inviteeEmail("user@test.com")
                .status(InvitationStatus.PENDING)
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build();
        invitation.setId(invitationId);

        when(invitationRepository.findById(invitationId)).thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any())).thenReturn(invitation);

        assertThatThrownBy(() -> invitationService.acceptInvitation(userId, invitationId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void acceptInvitation_shouldThrow_whenWrongUser() {
        UUID userId = UUID.randomUUID();
        UUID invitationId = UUID.randomUUID();
        Team team = buildTeam(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());

        Invitation invitation = Invitation.builder()
                .team(team)
                .inviterId(UUID.randomUUID())
                .inviteeEmail("other@test.com")
                .status(InvitationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        invitation.setId(invitationId);

        when(invitationRepository.findById(invitationId)).thenReturn(Optional.of(invitation));
        when(userPublicService.findById(userId))
                .thenReturn(Optional.of(UserSnapshot.builder().id(userId).email("me@test.com").build()));

        assertThatThrownBy(() -> invitationService.acceptInvitation(userId, invitationId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not for you");
    }

    private Team buildTeam(UUID teamId, UUID eventId, UUID leaderId) {
        Team team = Team.builder()
                .eventId(eventId)
                .name("Test Team")
                .leaderId(leaderId)
                .status(TeamStatus.FORMING)
                .build();
        team.setId(teamId);
        return team;
    }
}
