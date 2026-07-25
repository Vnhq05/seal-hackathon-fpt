package com.sealhackathon.team.service;

import com.sealhackathon.team.domain.Invitation;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.InvitationStatus;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.event.InvitationsExpiredDueToTeamFullEvent;
import com.sealhackathon.team.repository.InvitationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvitationStatusServiceTest {

    @Mock private InvitationRepository invitationRepository;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private InvitationStatusService invitationStatusService;

    @Test
    void expireAllPendingForTeamInCurrentTx_shouldExpireAndNotifyInvitees() {
        UUID teamId = UUID.randomUUID();
        Team team = Team.builder()
                .eventId(UUID.randomUUID())
                .name("Alpha")
                .leaderId(UUID.randomUUID())
                .status(TeamStatus.FORMING)
                .build();
        team.setId(teamId);

        Invitation first = Invitation.builder()
                .team(team)
                .inviterId(UUID.randomUUID())
                .inviteeEmail("a@test.com")
                .status(InvitationStatus.PENDING)
                .build();
        Invitation second = Invitation.builder()
                .team(team)
                .inviterId(UUID.randomUUID())
                .inviteeEmail("b@test.com")
                .status(InvitationStatus.PENDING)
                .build();

        when(invitationRepository.findByTeamIdAndStatus(teamId, InvitationStatus.PENDING))
                .thenReturn(List.of(first, second));

        invitationStatusService.expireAllPendingForTeamInCurrentTx(teamId);

        assertThat(first.getStatus()).isEqualTo(InvitationStatus.EXPIRED);
        assertThat(second.getStatus()).isEqualTo(InvitationStatus.EXPIRED);

        ArgumentCaptor<InvitationsExpiredDueToTeamFullEvent> eventCaptor =
                ArgumentCaptor.forClass(InvitationsExpiredDueToTeamFullEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());

        InvitationsExpiredDueToTeamFullEvent event = eventCaptor.getValue();
        assertThat(event.teamId()).isEqualTo(teamId);
        assertThat(event.teamName()).isEqualTo("Alpha");
        assertThat(event.inviteeEmails()).containsExactly("a@test.com", "b@test.com");
    }

    @Test
    void expireAllPendingForTeamInCurrentTx_shouldSkip_whenNoPending() {
        UUID teamId = UUID.randomUUID();
        when(invitationRepository.findByTeamIdAndStatus(teamId, InvitationStatus.PENDING))
                .thenReturn(List.of());

        invitationStatusService.expireAllPendingForTeamInCurrentTx(teamId);

        verify(eventPublisher, never()).publishEvent(any());
    }
}
