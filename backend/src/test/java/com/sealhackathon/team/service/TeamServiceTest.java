package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.dto.SystemConfigResponse;
import com.sealhackathon.common.service.SystemConfigService;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TeamServiceTest {

    @Mock private TeamRepository teamRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private EventPublicService eventPublicService;
    @Mock private UserPublicService userPublicService;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private EventEnrollmentService enrollmentService;
    @Mock private SystemConfigService systemConfigService;
    @Mock private HackathonEventRepository eventRepository;
    @Mock private TrackRepository trackRepository;

    @InjectMocks private TeamService teamService;

    private void stubTeamSizeConfig() {
        when(systemConfigService.getConfig()).thenReturn(SystemConfigResponse.builder()
                .minTeamMembers(3)
                .maxTeamMembers(5)
                .build());
    }

    private void stubEventCapacity(UUID eventId) {
        HackathonEvent event = HackathonEvent.builder().maxTeam(null).build();
        event.setId(eventId);
        when(eventRepository.findByIdForUpdate(eventId)).thenReturn(Optional.of(event));
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
    }

    private void stubEventOpen(UUID eventId) {
        when(eventPublicService.getEvent(eventId)).thenReturn(Optional.of(
                EventSnapshot.builder().id(eventId).status(EventStatus.OPEN).build()));
    }

    private void stubEnrollment(UUID userId, UUID eventId) {
        doNothing().when(enrollmentService).requireApprovedEnrollment(userId, eventId);
    }

    // ── BR-15, BR-16: Create team ──

    @Test
    void createTeam_shouldSucceed() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        stubEventOpen(eventId);
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().plusDays(7));
        stubTeamSizeConfig();
        stubEventCapacity(eventId);
        stubEnrollment(userId, eventId);
        when(teamRepository.existsByEventIdAndName(eventId, "Alpha")).thenReturn(false);
        when(teamMemberRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(false);
        when(teamRepository.save(any(Team.class))).thenAnswer(i -> {
            Team t = i.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });
        when(teamMemberRepository.save(any(TeamMember.class))).thenAnswer(i -> i.getArgument(0));
        when(teamMemberRepository.findByTeamId(any())).thenReturn(List.of());
        when(userPublicService.findAllByIds(any())).thenReturn(List.of());

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

        stubEventOpen(eventId);
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().plusDays(7));
        stubEventCapacity(eventId);
        stubEnrollment(userId, eventId);
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

        stubEventOpen(eventId);
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().plusDays(7));
        stubEventCapacity(eventId);
        stubEnrollment(userId, eventId);
        when(teamRepository.existsByEventIdAndName(eventId, "Beta")).thenReturn(false);
        when(teamMemberRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(true);

        CreateTeamRequest request = CreateTeamRequest.builder().name("Beta").eventId(eventId).build();

        assertThatThrownBy(() -> teamService.createTeam(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already a member");
    }

    // ── BR-15: Max team size — direct join deprecated ──

    @Test
    void joinTeam_shouldThrow_whenDeprecated() {
        UUID userId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        JoinTeamRequest request = JoinTeamRequest.builder().teamId(teamId).build();

        assertThatThrownBy(() -> teamService.joinTeam(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("join request");
    }

    // ── Registration closed ──

    @Test
    void createTeam_shouldThrow_whenRegistrationClosed() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        stubEventOpen(eventId);
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().minusDays(1));

        CreateTeamRequest request = CreateTeamRequest.builder().name("Late").eventId(eventId).build();

        assertThatThrownBy(() -> teamService.createTeam(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("deadline has passed");
    }

    @Test
    void createTeam_shouldSucceed_onDeadlineDayBeforeEndOfDay() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        stubEventOpen(eventId);
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(0));
        stubTeamSizeConfig();
        stubEventCapacity(eventId);
        stubEnrollment(userId, eventId);
        when(teamRepository.existsByEventIdAndName(eventId, "OnTime")).thenReturn(false);
        when(teamMemberRepository.existsByUserIdAndEventId(userId, eventId)).thenReturn(false);
        when(teamRepository.save(any(Team.class))).thenAnswer(i -> {
            Team t = i.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });
        when(teamMemberRepository.save(any(TeamMember.class))).thenAnswer(i -> i.getArgument(0));
        when(teamMemberRepository.findByTeamId(any())).thenReturn(List.of());
        when(userPublicService.findAllByIds(any())).thenReturn(List.of());

        CreateTeamRequest request = CreateTeamRequest.builder().name("OnTime").eventId(eventId).build();
        TeamResponse response = teamService.createTeam(userId, request);

        assertThat(response.getName()).isEqualTo("OnTime");
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

    // ── Event not open for team formation ──

    @Test
    void createTeam_shouldThrow_whenEventNotOpenForTeamFormation() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        when(eventPublicService.getEvent(eventId)).thenReturn(Optional.of(
                EventSnapshot.builder().id(eventId).status(EventStatus.UPCOMING).build()));

        CreateTeamRequest request = CreateTeamRequest.builder().name("X").eventId(eventId).build();

        assertThatThrownBy(() -> teamService.createTeam(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not open for team formation");
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
