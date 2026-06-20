package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.request.CreateTeamRequest;
import com.sealhackathon.team.dto.request.JoinTeamRequest;
import com.sealhackathon.team.dto.response.TeamResponse;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock private TeamRepository teamRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private EventPublicService eventPublicService;
    @Mock private UserPublicService userPublicService;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private TeamService teamService;

    // ── BR-15, BR-16: Create team ──

    @Test
    void createTeam_shouldSucceed() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        when(eventPublicService.isEventActive(eventId)).thenReturn(true);
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().plusDays(7));
        when(teamRepository.existsByEventIdAndName(eventId, "Alpha")).thenReturn(false);
        when(teamMemberRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(false);
        when(teamRepository.save(any(Team.class))).thenAnswer(i -> {
            Team t = i.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });
        when(teamMemberRepository.save(any(TeamMember.class))).thenAnswer(i -> i.getArgument(0));
        when(teamMemberRepository.findByTeamId(any())).thenReturn(List.of());

        CreateTeamRequest request = CreateTeamRequest.builder().name("Alpha").eventId(eventId).build();
        TeamResponse response = teamService.createTeam(userId, request);

        assertThat(response.getName()).isEqualTo("Alpha");
        assertThat(response.getStatus()).isEqualTo(TeamStatus.FORMING);

        ArgumentCaptor<TeamMember> captor = ArgumentCaptor.forClass(TeamMember.class);
        verify(teamMemberRepository).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo(TeamMemberRole.LEADER);
    }

    // ── BR-19: Duplicate team name ──

    @Test
    void createTeam_shouldThrow_whenNameDuplicate() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        when(eventPublicService.isEventActive(eventId)).thenReturn(true);
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().plusDays(7));
        when(teamRepository.existsByEventIdAndName(eventId, "Taken")).thenReturn(true);

        CreateTeamRequest request = CreateTeamRequest.builder().name("Taken").eventId(eventId).build();

        assertThatThrownBy(() -> teamService.createTeam(userId, request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    // ── BR-18: One participant per team per event ──

    @Test
    void createTeam_shouldThrow_whenAlreadyInTeam() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        when(eventPublicService.isEventActive(eventId)).thenReturn(true);
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().plusDays(7));
        when(teamRepository.existsByEventIdAndName(eventId, "Beta")).thenReturn(false);
        when(teamMemberRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(true);

        CreateTeamRequest request = CreateTeamRequest.builder().name("Beta").eventId(eventId).build();

        assertThatThrownBy(() -> teamService.createTeam(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already a member");
    }

    // ── BR-15: Max 5 members ──

    @Test
    void joinTeam_shouldThrow_whenTeamFull() {
        UUID userId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        Team team = buildTeam(teamId, eventId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(eventPublicService.isEventActive(eventId)).thenReturn(true);
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().plusDays(7));
        when(teamMemberRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(false);
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(5);

        JoinTeamRequest request = JoinTeamRequest.builder().teamId(teamId).build();

        assertThatThrownBy(() -> teamService.joinTeam(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("full");
    }

    // ── BR-22: Auto-confirm at 3 members ──

    @Test
    void joinTeam_shouldConfirmTeam_whenReaching3Members() {
        UUID userId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        Team team = buildTeam(teamId, eventId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(eventPublicService.isEventActive(eventId)).thenReturn(true);
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().plusDays(7));
        when(teamMemberRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(false);
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(2).thenReturn(3);
        when(teamMemberRepository.save(any(TeamMember.class))).thenAnswer(i -> i.getArgument(0));
        when(teamRepository.save(any(Team.class))).thenAnswer(i -> i.getArgument(0));
        when(teamMemberRepository.findByTeamId(any())).thenReturn(List.of());

        JoinTeamRequest request = JoinTeamRequest.builder().teamId(teamId).build();
        teamService.joinTeam(userId, request);

        assertThat(team.getStatus()).isEqualTo(TeamStatus.CONFIRMED);
    }

    // ── Registration closed ──

    @Test
    void createTeam_shouldThrow_whenRegistrationClosed() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        when(eventPublicService.isEventActive(eventId)).thenReturn(true);
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().minusDays(1));

        CreateTeamRequest request = CreateTeamRequest.builder().name("Late").eventId(eventId).build();

        assertThatThrownBy(() -> teamService.createTeam(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("deadline has passed");
    }

    // ── BR-20: Leader cannot remove self ──

    @Test
    void removeMember_shouldThrow_whenLeaderRemovesSelf() {
        UUID leaderId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Team team = buildTeam(teamId, UUID.randomUUID());
        team.setLeaderId(leaderId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

        assertThatThrownBy(() -> teamService.removeMember(leaderId, teamId, leaderId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Leader cannot remove themselves");
    }

    // ── Non-leader cannot remove members ──

    @Test
    void removeMember_shouldThrow_whenNotLeader() {
        UUID notLeaderId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Team team = buildTeam(teamId, UUID.randomUUID());
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

        assertThatThrownBy(() -> teamService.removeMember(notLeaderId, teamId, UUID.randomUUID()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only the team leader");
    }

    // ── Event not active ──

    @Test
    void createTeam_shouldThrow_whenEventNotActive() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        when(eventPublicService.isEventActive(eventId)).thenReturn(false);

        CreateTeamRequest request = CreateTeamRequest.builder().name("X").eventId(eventId).build();

        assertThatThrownBy(() -> teamService.createTeam(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not active");
    }

    private Team buildTeam(UUID teamId, UUID eventId) {
        Team team = Team.builder()
                .eventId(eventId)
                .name("Test Team")
                .leaderId(UUID.randomUUID())
                .status(TeamStatus.FORMING)
                .build();
        team.setId(teamId);
        return team;
    }
}
