package com.sealhackathon.team.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.dto.SystemConfigResponse;
import com.sealhackathon.common.service.SystemConfigService;
import com.sealhackathon.event.domain.CompetitionGroup;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.HackathonSkillRole;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.request.CreateTeamRequest;
import com.sealhackathon.team.dto.request.SelectTrackRequest;
import com.sealhackathon.team.dto.request.UpdateTeamRecruitmentRequest;
import com.sealhackathon.team.dto.response.TeamResponse;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
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
    @Mock private FormatRuleEngine formatRuleEngine;
    @Mock private CompetitionGroupRepository competitionGroupRepository;
    @Mock private GroupAssignmentService groupAssignmentService;

    @InjectMocks private TeamService teamService;

    @BeforeEach
    void stubFormatRules() {
        ReflectionTestUtils.setField(teamService, "maxSkillRoles", 5);
        doNothing().when(formatRuleEngine).assertCanCreateTeam(any());
        doNothing().when(formatRuleEngine).assertCanModifyTeamMembers(any());
    }

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
        when(teamRepository.existsByEventIdAndNameAndStatusNot(eventId, "Alpha", TeamStatus.DISBANDED)).thenReturn(false);
        when(teamMemberRepository.existsActiveByUserIdAndEventId(userId, eventId)).thenReturn(false);
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
        when(teamRepository.existsByEventIdAndNameAndStatusNot(eventId, "Taken", TeamStatus.DISBANDED)).thenReturn(true);

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
        when(teamRepository.existsByEventIdAndNameAndStatusNot(eventId, "Beta", TeamStatus.DISBANDED)).thenReturn(false);
        when(teamMemberRepository.existsActiveByUserIdAndEventId(userId, eventId)).thenReturn(true);

        CreateTeamRequest request = CreateTeamRequest.builder().name("Beta").eventId(eventId).build();

        assertThatThrownBy(() -> teamService.createTeam(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already a member");
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
    void createTeam_shouldThrow_whenRegistrationPhaseClosed() {
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        doThrow(new BusinessException("Event is not open for team formation", HttpStatus.BAD_REQUEST))
                .when(formatRuleEngine).assertCanCreateTeam(eventId);

        CreateTeamRequest request = CreateTeamRequest.builder().name("Blocked").eventId(eventId).build();

        assertThatThrownBy(() -> teamService.createTeam(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not open for team formation");
    }

    @Test
    void validateMemberChangesAllowed_shouldDelegateToFormatRuleEngineAndCheckDeadline() {
        UUID eventId = UUID.randomUUID();
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().plusDays(7));
        teamService.validateMemberChangesAllowed(eventId);
        verify(formatRuleEngine).assertCanModifyTeamMembers(eventId);
    }

    @Test
    void validateMemberChangesAllowed_shouldThrow_whenRegistrationDeadlinePassed() {
        UUID eventId = UUID.randomUUID();
        when(eventPublicService.getRegistrationDeadline(eventId))
                .thenReturn(LocalDateTime.now().minusDays(1));

        assertThatThrownBy(() -> teamService.validateMemberChangesAllowed(eventId))
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
        when(teamRepository.existsByEventIdAndNameAndStatusNot(eventId, "OnTime", TeamStatus.DISBANDED)).thenReturn(false);
        when(teamMemberRepository.existsActiveByUserIdAndEventId(userId, eventId)).thenReturn(false);
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

        doThrow(new BusinessException("Event is not open for team formation", HttpStatus.BAD_REQUEST))
                .when(formatRuleEngine).assertCanCreateTeam(eventId);

        CreateTeamRequest request = CreateTeamRequest.builder().name("X").eventId(eventId).build();

        assertThatThrownBy(() -> teamService.createTeam(userId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not open for team formation");
    }

    // ── Recruitment ──

    @Test
    void updateRecruitment_shouldThrow_whenNotLeader() {
        UUID leaderId = UUID.randomUUID();
        UUID notLeaderId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        Team team = buildTeam(teamId, eventId);
        team.setLeaderId(leaderId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

        UpdateTeamRecruitmentRequest request = UpdateTeamRecruitmentRequest.builder()
                .isRecruiting(true)
                .neededRoles(List.of(HackathonSkillRole.BACKEND))
                .build();

        assertThatThrownBy(() -> teamService.updateRecruitment(notLeaderId, eventId, teamId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only the team leader");
    }

    @Test
    void updateRecruitment_shouldPersistRecruitingFlag_whenLeader() {
        UUID leaderId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        Team team = buildTeam(teamId, eventId);
        team.setLeaderId(leaderId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(2);
        when(teamMemberRepository.findByTeamId(teamId)).thenReturn(List.of());
        when(systemConfigService.getConfig()).thenReturn(SystemConfigResponse.builder()
                .minTeamMembers(3).maxTeamMembers(5).build());

        UpdateTeamRecruitmentRequest request = UpdateTeamRecruitmentRequest.builder()
                .isRecruiting(true)
                .recruitmentNote("Need backend")
                .neededRoles(List.of(HackathonSkillRole.BACKEND))
                .build();

        TeamResponse response = teamService.updateRecruitment(leaderId, eventId, teamId, request);

        ArgumentCaptor<Team> captor = ArgumentCaptor.forClass(Team.class);
        verify(teamRepository).save(captor.capture());
        assertThat(captor.getValue().isRecruiting()).isTrue();
        assertThat(response.isRecruiting()).isTrue();
    }

    @Test
    void syncRecruitingStatus_shouldClearFlag_whenTeamFull() {
        UUID teamId = UUID.randomUUID();
        Team team = buildTeam(teamId, UUID.randomUUID());
        team.setRecruiting(true);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(5);
        when(systemConfigService.getConfig()).thenReturn(SystemConfigResponse.builder()
                .minTeamMembers(3).maxTeamMembers(5).build());

        teamService.syncRecruitingStatus(teamId);

        ArgumentCaptor<Team> captor = ArgumentCaptor.forClass(Team.class);
        verify(teamRepository).save(captor.capture());
        assertThat(captor.getValue().isRecruiting()).isFalse();
    }

    @Test
    void getTeamById_shouldHideMemberEmails_forNonMember() {
        UUID teamId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID memberUserId = UUID.randomUUID();
        UUID viewerId = UUID.randomUUID();

        Team team = buildTeam(teamId, eventId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamId(teamId)).thenReturn(List.of(
                TeamMember.builder().userId(memberUserId).role(TeamMemberRole.MEMBER).build()));
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, viewerId)).thenReturn(Optional.empty());
        when(userPublicService.findAllByIds(List.of(memberUserId))).thenReturn(List.of(
                UserSnapshot.builder().id(memberUserId).fullName("Member").email("member@test.com").build()));
        when(systemConfigService.getConfig()).thenReturn(SystemConfigResponse.builder()
                .minTeamMembers(3).maxTeamMembers(5).build());

        TeamResponse response = teamService.getTeamById(teamId, viewerId, UserType.FPT_STUDENT);

        assertThat(response.getMembers()).hasSize(1);
        assertThat(response.getMembers().get(0).getEmail()).isNull();
        assertThat(response.getMembers().get(0).getFullName()).isEqualTo("Member");
    }

    // ── Leave / undersized team rules ──

    @Test
    void leaveTeam_shouldRemoveMember_whenNotLeader() {
        UUID eventId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID leaderId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        stubTeamSizeConfig();

        Team team = buildTeam(teamId, eventId);
        team.setLeaderId(leaderId);
        team.setStatus(TeamStatus.CONFIRMED);
        TeamMember member = TeamMember.builder().userId(memberId).role(TeamMemberRole.MEMBER).build();

        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, memberId)).thenReturn(Optional.of(member));
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(2);
        when(teamRepository.save(any(Team.class))).thenAnswer(i -> i.getArgument(0));

        teamService.leaveTeam(memberId, teamId);

        verify(teamMemberRepository).delete(member);
        verify(eventPublisher).publishEvent(any(com.sealhackathon.team.event.MemberLeftEvent.class));
        assertThat(team.getStatus()).isEqualTo(TeamStatus.FORMING);
    }

    @Test
    void leaveTeam_shouldThrow_whenLeader() {
        UUID teamId = UUID.randomUUID();
        UUID leaderId = UUID.randomUUID();

        Team team = buildTeam(teamId, UUID.randomUUID());
        team.setLeaderId(leaderId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

        assertThatThrownBy(() -> teamService.leaveTeam(leaderId, teamId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Team leader cannot leave");
    }

    @Test
    void leaveTeam_shouldCleanupMembership_whenTeamDisbanded() {
        UUID teamId = UUID.randomUUID();
        UUID leaderId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();

        Team team = buildTeam(teamId, UUID.randomUUID());
        team.setLeaderId(leaderId);
        team.setStatus(TeamStatus.DISBANDED);
        TeamMember leftover = TeamMember.builder().userId(memberId).role(TeamMemberRole.MEMBER).build();

        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, memberId)).thenReturn(Optional.of(leftover));

        teamService.leaveTeam(memberId, teamId);

        verify(teamMemberRepository).delete(leftover);
        verify(eventPublisher).publishEvent(any(com.sealhackathon.team.event.MemberLeftEvent.class));
        verify(formatRuleEngine, org.mockito.Mockito.never()).assertCanModifyTeamMembers(any());
    }

    @Test
    void leaveTeam_shouldCleanupLeaderMembership_whenTeamDisbanded() {
        UUID teamId = UUID.randomUUID();
        UUID leaderId = UUID.randomUUID();

        Team team = buildTeam(teamId, UUID.randomUUID());
        team.setLeaderId(leaderId);
        team.setStatus(TeamStatus.DISBANDED);
        TeamMember leftover = TeamMember.builder().userId(leaderId).role(TeamMemberRole.LEADER).build();

        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, leaderId)).thenReturn(Optional.of(leftover));

        teamService.leaveTeam(leaderId, teamId);

        verify(teamMemberRepository).delete(leftover);
        verify(eventPublisher).publishEvent(any(com.sealhackathon.team.event.MemberLeftEvent.class));
    }

    @Test
    void disbandUndersizedTeams_shouldReturnMembersToWaitingList() {
        UUID eventId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        stubTeamSizeConfig();

        Team team = buildTeam(teamId, eventId);
        team.setStatus(TeamStatus.FORMING);
        TeamMember member = TeamMember.builder().userId(userId).role(TeamMemberRole.LEADER).build();

        when(teamRepository.findByEventId(eventId)).thenReturn(List.of(team));
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(1);
        when(teamMemberRepository.findByTeamId(teamId)).thenReturn(List.of(member));
        when(teamRepository.save(any(Team.class))).thenAnswer(i -> i.getArgument(0));

        int count = teamService.disbandUndersizedTeams(eventId);

        assertThat(count).isEqualTo(1);
        assertThat(team.getStatus()).isEqualTo(TeamStatus.DISBANDED);
        verify(teamMemberRepository).delete(member);
        verify(eventPublisher).publishEvent(any(com.sealhackathon.team.event.MemberLeftEvent.class));
        verify(enrollmentService, org.mockito.Mockito.never()).forceWithdrawEnrollment(any(), any());
    }

    @Test
    void disbandUndersizedTeams_shouldSkipConfirmedTeamsAtMinSize() {
        UUID eventId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        stubTeamSizeConfig();

        Team team = buildTeam(teamId, eventId);
        team.setStatus(TeamStatus.CONFIRMED);

        when(teamRepository.findByEventId(eventId)).thenReturn(List.of(team));
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(3);

        int count = teamService.disbandUndersizedTeams(eventId);

        assertThat(count).isZero();
        assertThat(team.getStatus()).isEqualTo(TeamStatus.CONFIRMED);
        verify(teamMemberRepository, org.mockito.Mockito.never()).delete(any());
    }

    // ── Track is chosen once: selecting again must not silently move the team ──

    @Test
    void selectTrack_shouldThrowConflict_whenTeamAlreadyHasTrack() {
        UUID leaderId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();

        Team team = buildTeam(teamId, eventId);
        team.setLeaderId(leaderId);
        team.setTrackId(UUID.randomUUID());
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

        assertThatThrownBy(() -> teamService.selectTrack(leaderId, teamId, new SelectTrackRequest(UUID.randomUUID())))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Team already has a track assigned")
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(teamRepository, never()).save(any());
        verify(groupAssignmentService, never()).autoAssignGroup(any());
    }

    @Test
    void selectTrack_shouldAutoAssignGroup_whenNoTrackYet() {
        UUID leaderId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID trackId = UUID.randomUUID();

        Team team = buildTeam(teamId, eventId);
        team.setLeaderId(leaderId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(3);
        when(teamMemberRepository.findByTeamId(teamId)).thenReturn(List.of());
        stubTeamSizeConfig();

        HackathonEvent event = HackathonEvent.builder().build();
        event.setId(eventId);
        Track track = Track.builder().hackathonEvent(event).name("AI").maxTeams(20).build();
        track.setId(trackId);
        when(trackRepository.findById(trackId)).thenReturn(Optional.of(track));

        teamService.selectTrack(leaderId, teamId, new SelectTrackRequest(trackId));

        ArgumentCaptor<Team> captor = ArgumentCaptor.forClass(Team.class);
        verify(teamRepository).save(captor.capture());
        assertThat(captor.getValue().getTrackId()).isEqualTo(trackId);
        verify(groupAssignmentService).autoAssignGroup(team);
    }

    @Test
    void getTeamById_shouldIncludeGroupName_whenTeamHasGroup() {
        UUID teamId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();

        Team team = buildTeam(teamId, UUID.randomUUID());
        team.setGroupId(groupId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamId(teamId)).thenReturn(List.of());
        stubTeamSizeConfig();

        CompetitionGroup group = CompetitionGroup.builder().name("GA1").build();
        group.setId(groupId);
        when(competitionGroupRepository.findById(groupId)).thenReturn(Optional.of(group));

        TeamResponse response = teamService.getTeamById(teamId, null, null);

        assertThat(response.getGroupName()).isEqualTo("GA1");
    }

    @Test
    void getTeamById_shouldReturnNullGroupName_whenTeamHasNoGroup() {
        UUID teamId = UUID.randomUUID();

        Team team = buildTeam(teamId, UUID.randomUUID());
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamId(teamId)).thenReturn(List.of());
        stubTeamSizeConfig();

        TeamResponse response = teamService.getTeamById(teamId, null, null);

        assertThat(response.getGroupName()).isNull();
        verify(competitionGroupRepository, never()).findById(any());
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
