package com.sealhackathon.team.service;

import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.common.service.SystemConfigService;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.CompetitionGroup;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.dto.response.IncompleteAssignmentScopeResponse;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.event.service.JudgeAssignmentService;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.HackathonSkillRole;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.request.CreateTeamRequest;
import com.sealhackathon.team.dto.request.SelectTrackRequest;
import com.sealhackathon.team.dto.request.UpdateTeamGroupRequest;
import com.sealhackathon.team.dto.request.UpdateTeamRecruitmentRequest;
import com.sealhackathon.team.dto.response.TeamMemberResponse;
import com.sealhackathon.team.dto.response.TeamResponse;
import com.sealhackathon.team.dto.response.UpdateTeamGroupResponse;
import com.sealhackathon.team.event.MemberJoinedEvent;
import com.sealhackathon.team.event.MemberKickedEvent;
import com.sealhackathon.team.event.MemberLeftEvent;
import com.sealhackathon.team.event.TeamConfirmedEvent;
import com.sealhackathon.team.event.TeamCreatedEvent;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final HackathonEventRepository eventRepository;
    private final EventPublicService eventPublicService;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;
    private final EventEnrollmentService enrollmentService;
    private final SystemConfigService systemConfigService;
    private final TrackRepository trackRepository;
    private final FormatRuleEngine formatRuleEngine;
    private final CompetitionGroupRepository competitionGroupRepository;
    private final JudgeAssignmentService judgeAssignmentService;
    private final AuditService auditService;
    private final AuthPublicService authPublicService;
    private final GroupAssignmentService groupAssignmentService;

    @Value("${app.hackathon.team.max-skill-roles:5}")
    private int maxSkillRoles;

    private int getMinTeamSize() {
        return systemConfigService.getMinTeamMembers();
    }

    private int getMaxTeamSize() {
        return systemConfigService.getMaxTeamMembers();
    }

    /**
     * Event {@code minTeam}/{@code maxTeam} override system defaults when set (same rule as FE
     * {@code resolveEventTeamSize}). Keeps invitation / join-request capacity in sync with the
     * values admin/coordinator edit on the event.
     */
    public int resolveMinTeamMembers(UUID eventId) {
        return eventRepository.findById(eventId)
                .map(HackathonEvent::getMinTeam)
                .filter(v -> v != null && v > 0)
                .orElseGet(this::getMinTeamSize);
    }

    public int resolveMaxTeamMembers(UUID eventId) {
        return eventRepository.findById(eventId)
                .map(HackathonEvent::getMaxTeam)
                .filter(v -> v != null && v > 0)
                .orElseGet(this::getMaxTeamSize);
    }

    // ── BR-15, BR-16: Create team (form 1 — create new) ──
    @Transactional
    public TeamResponse createTeam(UUID currentUserId, CreateTeamRequest request) {
        validateTeamFormationAllowed(request.getEventId());
        validateRegistrationOpen(request.getEventId());
        validateTeamCapacity(request.getEventId());
        enrollmentService.requireApprovedEnrollment(currentUserId, request.getEventId());

        // BR-19: team name unique per event — disbanded teams release their name
        if (teamRepository.existsByEventIdAndNameAndStatusNot(
                request.getEventId(), request.getName(), TeamStatus.DISBANDED)) {
            throw new DuplicateResourceException("Team", "name", request.getName());
        }

        // BR-18: participant can only be in one team per event — disbanded teams don't count
        if (teamMemberRepository.existsActiveByUserIdAndEventId(currentUserId, request.getEventId())) {
            throw new BusinessException(
                    "You are already a member of a team in this event",
                    HttpStatus.CONFLICT) {};
        }
        // Leftover membership on a disbanded team blocks the unique (event_id, user_id) row — clear it
        teamMemberRepository.findByUserIdAndEventId(currentUserId, request.getEventId())
                .ifPresent(teamMemberRepository::delete);
        teamMemberRepository.flush();

        Team team = Team.builder()
                .eventId(request.getEventId())
                .name(request.getName())
                .leaderId(currentUserId)
                .status(TeamStatus.FORMING)
                .build();
        team = teamRepository.save(team);

        // Add creator as leader member
        TeamMember leader = TeamMember.builder()
                .team(team)
                .eventId(team.getEventId())
                .userId(currentUserId)
                .role(TeamMemberRole.LEADER)
                .joinedAt(LocalDateTime.now())
                .build();
        teamMemberRepository.save(leader);

        eventPublisher.publishEvent(new TeamCreatedEvent(
                team.getId(), team.getEventId(), currentUserId, team.getName()));
        eventPublisher.publishEvent(new MemberJoinedEvent(
                team.getId(), currentUserId, TeamMemberRole.LEADER));

        closeRegistrationIfMaxTeamsReached(request.getEventId());

        return toResponse(team, currentUserId, null);
    }

    @Transactional
    public TeamResponse updateRecruitment(
            UUID leaderId, UUID eventId, UUID teamId, UpdateTeamRecruitmentRequest request) {
        Team team = getTeam(teamId);
        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }
        guardLeader(team, leaderId);

        if (team.getStatus() == TeamStatus.DISBANDED) {
            throw new BusinessException("Team is disbanded", HttpStatus.BAD_REQUEST) {};
        }

        int memberCount = teamMemberRepository.countByTeamId(teamId);
        int maxSize = resolveMaxTeamMembers(eventId);

        if (request.isRecruiting() && memberCount >= maxSize) {
            throw new BusinessException("Cannot recruit — team is full", HttpStatus.BAD_REQUEST) {};
        }

        String note = request.getRecruitmentNote();
        if (note != null && note.length() > 1000) {
            throw new BusinessException("Recruitment note cannot exceed 1000 characters", HttpStatus.BAD_REQUEST) {};
        }

        List<HackathonSkillRole> roles = normalizeNeededRoles(request.getNeededRoles());

        team.setRecruitmentNote(note != null && !note.isBlank() ? note.trim() : null);
        team.setNeededRoles(new ArrayList<>(roles));
        team.setRecruiting(request.isRecruiting() && memberCount < maxSize);

        teamRepository.save(team);
        return toResponse(team, leaderId, null);
    }

    /** Clears recruiting flag when team reaches max capacity. */
    @Transactional
    public void syncRecruitingStatus(UUID teamId) {
        Team team = getTeam(teamId);
        int memberCount = teamMemberRepository.countByTeamId(teamId);
        if (memberCount >= resolveMaxTeamMembers(team.getEventId()) && team.isRecruiting()) {
            team.setRecruiting(false);
            teamRepository.save(team);
        }
    }

    @Transactional
    public TeamResponse selectTrack(UUID leaderId, UUID teamId, SelectTrackRequest request) {
        Team team = getTeam(teamId);
        formatRuleEngine.validateLeaderCannotSelectTrack(team.getEventId());
        guardLeader(team, leaderId);
        if (team.getTrackId() != null) {
            throw new BusinessException("Team already has a track assigned", HttpStatus.CONFLICT) {};
        }

        int size = teamMemberRepository.countByTeamId(teamId);
        int minSize = resolveMinTeamMembers(team.getEventId());
        if (size < minSize) {
            throw new BusinessException(
                    "Team must have at least " + minSize + " members before selecting a track",
                    HttpStatus.BAD_REQUEST) {};
        }

        Track track = trackRepository.findById(request.getTrackId())
                .orElseThrow(() -> new ResourceNotFoundException("Track", "id", request.getTrackId()));
        if (!track.getHackathonEvent().getId().equals(team.getEventId())) {
            throw new BusinessException("Track does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }

        formatRuleEngine.validateTrackCapacity(team.getEventId(), request.getTrackId());

        team.setTrackId(request.getTrackId());
        groupAssignmentService.autoAssignGroup(team);
        teamRepository.save(team);
        return toResponse(team, leaderId, null);
    }

    @Transactional
    public UpdateTeamGroupResponse updateTeamGroup(
            UUID eventId, UUID teamId, UpdateTeamGroupRequest request, String ipAddress) {
        Team team = getTeam(teamId);
        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }
        if (team.getTrackId() == null) {
            throw new BusinessException("Team must have a track before assigning a group", HttpStatus.BAD_REQUEST) {};
        }

        UUID oldGroupId = team.getGroupId();
        UUID newGroupId = request.getGroupId();
        String newGroupName = null;

        if (newGroupId != null) {
            CompetitionGroup group = competitionGroupRepository.findByIdAndTrackId(newGroupId, team.getTrackId())
                    .orElseThrow(() -> new BusinessException(
                            "Group does not belong to the team's track", HttpStatus.BAD_REQUEST) {});
            newGroupName = group.getName();
        }

        team.setGroupId(newGroupId);
        teamRepository.save(team);

        auditService.log(
                authPublicService.getCurrentUserId(),
                "TEAM_GROUP_CHANGED",
                teamId,
                "Team",
                "{\"groupId\":" + (oldGroupId != null ? "\"" + oldGroupId + "\"" : "null") + "}",
                "{\"groupId\":" + (newGroupId != null ? "\"" + newGroupId + "\"" : "null") + "}",
                ipAddress);

        List<IncompleteAssignmentScopeResponse> incomplete = newGroupId != null
                ? judgeAssignmentService.computeIncompleteScopesForGroupInEvent(eventId, newGroupId)
                : List.of();
        String warning = incomplete.isEmpty() ? null
                : "Group \"" + (newGroupName != null ? newGroupName : newGroupId)
                        + "\" has fewer than the minimum required judges.";

        return UpdateTeamGroupResponse.builder()
                .teamId(teamId)
                .groupId(newGroupId)
                .groupName(newGroupName)
                .warning(warning)
                .incompleteScopes(incomplete)
                .build();
    }

    public void notifyTeamCountChanged(UUID eventId) {
        closeRegistrationIfMaxTeamsReached(eventId);
    }

    // ── Remove member (leader action) ──
    @Transactional
    public TeamResponse removeMember(UUID leaderId, UUID teamId, UUID memberId) {
        Team team = getTeam(teamId);
        formatRuleEngine.assertCanModifyTeamMembers(team.getEventId());
        guardLeader(team, leaderId);

        if (memberId.equals(leaderId)) {
            throw new BusinessException("Leader cannot remove themselves. Transfer leadership first.",
                    HttpStatus.BAD_REQUEST) {};
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, memberId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamMember", "userId", memberId));

        teamMemberRepository.delete(member);
        eventPublisher.publishEvent(new MemberLeftEvent(teamId, memberId));
        eventPublisher.publishEvent(new MemberKickedEvent(teamId, memberId, team.getName()));

        // Revert to FORMING if below min
        updateTeamStatus(team);
        syncRecruitingStatus(teamId);

        return toResponse(team, leaderId, null);
    }
    /**
     * Voluntary leave — allowed only before the competition starts
     * (OPEN / UPCOMING via {@link FormatRuleEngine#assertCanModifyTeamMembers}).
     * Disbanded teams are an exception: leftover membership is cleaned up so the
     * student returns to the waiting list (approved enrollment, no team).
     */
    @Transactional
    public void leaveTeam(UUID currentUserId, UUID teamId) {
        Team team = getTeam(teamId);

        // Already disbanded — just clear leftover membership → waiting list
        if (team.getStatus() == TeamStatus.DISBANDED) {
            TeamMember leftover = teamMemberRepository.findByTeamIdAndUserId(teamId, currentUserId)
                    .orElseThrow(() -> new BusinessException(
                            "You are not a member of this team", HttpStatus.BAD_REQUEST) {});
            teamMemberRepository.delete(leftover);
            eventPublisher.publishEvent(new MemberLeftEvent(teamId, currentUserId));
            return;
        }

        formatRuleEngine.assertCanModifyTeamMembers(team.getEventId());

        if (currentUserId.equals(team.getLeaderId())) {
            throw new BusinessException(
                    "Team leader cannot leave directly. Transfer leadership first.",
                    HttpStatus.BAD_REQUEST) {};
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, currentUserId)
                .orElseThrow(() -> new BusinessException(
                        "You are not a member of this team", HttpStatus.BAD_REQUEST) {});

        teamMemberRepository.delete(member);
        eventPublisher.publishEvent(new MemberLeftEvent(teamId, currentUserId));

        updateTeamStatus(team);
        syncRecruitingStatus(teamId);
    }

    /**
     * Force-remove undersized teams and return those students to the waiting list
     * (approved enrollment, no team membership).
     * Called when registration closes or the competition becomes ACTIVE.
     *
     * @return number of teams disbanded
     */
    @Transactional
    public int disbandUndersizedTeams(UUID eventId) {
        int minSize = resolveMinTeamMembers(eventId);
        int disbanded = 0;

        for (Team team : teamRepository.findByEventId(eventId)) {
            if (team.getStatus() == TeamStatus.DISBANDED) {
                continue;
            }
            int size = teamMemberRepository.countByTeamId(team.getId());
            if (size >= minSize) {
                continue;
            }

            List<TeamMember> members = teamMemberRepository.findByTeamId(team.getId());
            for (TeamMember member : members) {
                UUID userId = member.getUserId();
                teamMemberRepository.delete(member);
                eventPublisher.publishEvent(new MemberLeftEvent(team.getId(), userId));
            }

            team.setStatus(TeamStatus.DISBANDED);
            team.setRecruiting(false);
            teamRepository.save(team);
            disbanded++;
        }

        return disbanded;
    }

    // ── Transfer leadership — BR-20 ──
    @Transactional
    public TeamResponse transferLeadership(UUID currentLeaderId, UUID teamId, UUID newLeaderId) {
        Team team = getTeam(teamId);
        guardLeader(team, currentLeaderId);
        validateMemberChangesAllowed(team.getEventId());

        TeamMember newLeaderMember = teamMemberRepository.findByTeamIdAndUserId(teamId, newLeaderId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamMember", "userId", newLeaderId));

        TeamMember currentLeaderMember = teamMemberRepository.findByTeamIdAndUserId(teamId, currentLeaderId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamMember", "userId", currentLeaderId));

        currentLeaderMember.setRole(TeamMemberRole.MEMBER);
        newLeaderMember.setRole(TeamMemberRole.LEADER);
        team.setLeaderId(newLeaderId);

        teamMemberRepository.save(currentLeaderMember);
        teamMemberRepository.save(newLeaderMember);
        teamRepository.save(team);

        return toResponse(team, currentLeaderId, null);
    }

    @Transactional
    public TeamResponse renameTeam(UUID leaderId, UUID teamId, String newName) {
        Team team = getTeam(teamId);
        guardLeader(team, leaderId);

        String trimmedName = newName != null ? newName.trim() : "";
        if (trimmedName.isBlank()) {
            throw new BusinessException("Team name cannot be empty", HttpStatus.BAD_REQUEST) {};
        }

        if (!trimmedName.equals(team.getName())
                && teamRepository.existsByEventIdAndNameAndStatusNot(
                        team.getEventId(), trimmedName, TeamStatus.DISBANDED)) {
            throw new DuplicateResourceException("Team", "name", trimmedName);
        }

        team.setName(trimmedName);
        teamRepository.save(team);
        return toResponse(team, leaderId, null);
    }

    @Transactional(readOnly = true)
    public TeamResponse getTeamById(UUID teamId, UUID viewerId, UserType viewerRole) {
        return toResponse(getTeam(teamId), viewerId, viewerRole, false);
    }

    @Transactional(readOnly = true)
    public TeamResponse getMyTeam(UUID userId, UUID eventId) {
        // Disbanded teams are invisible here — the student is back on the waiting list
        UUID teamId = teamMemberRepository.findActiveTeamIdByUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "userId+eventId",
                        userId + " in event " + eventId));
        return toResponse(getTeam(teamId), userId, null, false);
    }

    @Transactional(readOnly = true)
    public Page<TeamResponse> getTeamsByEvent(
            UUID eventId, UUID viewerId, UserType viewerRole, Pageable pageable) {
        Page<Team> teams = teamRepository.findByEventId(eventId, pageable);
        Map<UUID, String> groupNames = resolveGroupNames(teams.getContent());
        return teams.map(team -> toResponse(team, viewerId, viewerRole, true,
                team.getGroupId() == null ? null : groupNames.get(team.getGroupId())));
    }

    // ═══ Helpers ═══

    Team getTeam(UUID teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
    }

    private void checkAndConfirmTeam(Team team) {
        int size = teamMemberRepository.countByTeamId(team.getId());
        if (size >= resolveMinTeamMembers(team.getEventId()) && team.getStatus() == TeamStatus.FORMING) {
            team.setStatus(TeamStatus.CONFIRMED);
            teamRepository.save(team);
            eventPublisher.publishEvent(new TeamConfirmedEvent(team.getId(), size));
        }
    }

    private void updateTeamStatus(Team team) {
        int size = teamMemberRepository.countByTeamId(team.getId());
        int minSize = resolveMinTeamMembers(team.getEventId());
        int maxSize = resolveMaxTeamMembers(team.getEventId());
        if (size < minSize && team.getStatus() == TeamStatus.CONFIRMED) {
            team.setStatus(TeamStatus.FORMING);
            teamRepository.save(team);
        }
        if (size >= maxSize && team.isRecruiting()) {
            team.setRecruiting(false);
            teamRepository.save(team);
        }
    }

    private void guardLeader(Team team, UUID userId) {
        if (!team.getLeaderId().equals(userId)) {
            throw new BusinessException("Only the team leader can perform this action",
                    HttpStatus.FORBIDDEN) {};
        }
    }

    public void validateTeamFormationAllowed(UUID eventId) {
        formatRuleEngine.assertCanCreateTeam(eventId);
    }

    public void validateMemberChangesAllowed(UUID eventId) {
        formatRuleEngine.assertCanModifyTeamMembers(eventId);
        validateRegistrationOpen(eventId);
    }

    public void validateRegistrationOpen(UUID eventId) {
        LocalDateTime deadline = eventPublicService.getRegistrationDeadline(eventId);
        if (deadline != null && LocalDateTime.now().isAfter(deadline)) {
            throw new BusinessException("Registration deadline has passed", HttpStatus.BAD_REQUEST) {};
        }
    }

    private void validateTeamCapacity(UUID eventId) {
        // event.maxTeam = max members per team; platform maxTeams = max teams in an event
        Integer maxTeams = systemConfigService.getConfig().getMaxTeams();
        if (maxTeams == null || maxTeams <= 0) {
            return;
        }
        eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
        long teamCount = teamRepository.countByEventId(eventId);
        if (teamCount >= maxTeams) {
            throw new BusinessException(
                    "Maximum team capacity (" + maxTeams + ") has been reached",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void closeRegistrationIfMaxTeamsReached(UUID eventId) {
        Integer maxTeams = systemConfigService.getConfig().getMaxTeams();
        if (maxTeams == null || maxTeams <= 0) {
            return;
        }
        HackathonEvent event = eventRepository.findById(eventId).orElse(null);
        if (event == null) {
            return;
        }
        long teamCount = teamRepository.countByEventId(eventId);
        if (teamCount >= maxTeams) {
            event.setRegistrationDeadline(LocalDate.now().minusDays(1));
            eventRepository.save(event);
        }
    }

    TeamResponse toResponse(Team team) {
        return toResponse(team, null, null, false);
    }

    TeamResponse toResponse(Team team, UUID viewerId, UserType viewerRole) {
        return toResponse(team, viewerId, viewerRole, false);
    }

    TeamResponse toResponse(Team team, UUID viewerId, UserType viewerRole, boolean listSummaryOnly) {
        return toResponse(team, viewerId, viewerRole, listSummaryOnly, resolveGroupName(team.getGroupId()));
    }

    private String resolveGroupName(UUID groupId) {
        return groupId == null ? null
                : competitionGroupRepository.findById(groupId)
                        .map(CompetitionGroup::getName)
                        .orElse(null);
    }

    /** One lookup for a whole page, so listing teams does not fan out into a query per team. */
    private Map<UUID, String> resolveGroupNames(List<Team> teams) {
        Set<UUID> groupIds = teams.stream()
                .map(Team::getGroupId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        if (groupIds.isEmpty()) {
            return Map.of();
        }
        return competitionGroupRepository.findAllById(groupIds).stream()
                .collect(Collectors.toMap(CompetitionGroup::getId, CompetitionGroup::getName));
    }

    private TeamResponse toResponse(
            Team team, UUID viewerId, UserType viewerRole, boolean listSummaryOnly, String groupName) {
        List<TeamMember> members = teamMemberRepository.findByTeamId(team.getId());
        List<UUID> userIds = members.stream().map(TeamMember::getUserId).toList();
        Map<UUID, UserSnapshot> userMap = userPublicService.findAllByIds(userIds).stream()
                .collect(Collectors.toMap(UserSnapshot::getId, u -> u));

        boolean fullAccess = canViewPrivateTeamDetails(team.getId(), viewerId, viewerRole);

        List<TeamMemberResponse> memberResponses;
        if (listSummaryOnly) {
            memberResponses = List.of();
        } else {
            memberResponses = members.stream()
                    .map(tm -> mapMemberResponse(tm, userMap.get(tm.getUserId()), fullAccess))
                    .toList();
        }

        int minTeamMembers = resolveMinTeamMembers(team.getEventId());
        int maxTeamMembers = resolveMaxTeamMembers(team.getEventId());
        int memberCount = members.size();

        List<HackathonSkillRole> neededRoles = team.getNeededRoles() != null
                ? List.copyOf(team.getNeededRoles())
                : List.of();

        return TeamResponse.builder()
                .id(team.getId())
                .eventId(team.getEventId())
                .name(team.getName())
                .leaderId(team.getLeaderId())
                .status(team.getStatus())
                .trackId(team.getTrackId())
                .groupId(team.getGroupId())
                .groupName(groupName)
                .memberCount(memberCount)
                .minTeamMembers(minTeamMembers)
                .maxTeamMembers(maxTeamMembers)
                .canSelectTrack(false)
                .members(memberResponses)
                .createdAt(team.getCreatedAt())
                .isRecruiting(team.isRecruiting())
                .recruitmentNote(team.getRecruitmentNote())
                .neededRoles(neededRoles)
                .build();
    }

    private TeamMemberResponse mapMemberResponse(
            TeamMember tm, UserSnapshot user, boolean includeEmail) {
        return TeamMemberResponse.builder()
                .id(tm.getId())
                .userId(tm.getUserId())
                .fullName(user != null ? user.getFullName() : null)
                .email(includeEmail && user != null ? user.getEmail() : null)
                .role(tm.getRole())
                .joinedAt(tm.getJoinedAt())
                .build();
    }

    private boolean canViewPrivateTeamDetails(UUID teamId, UUID viewerId, UserType viewerRole) {
        if (viewerRole == UserType.SYSTEM_ADMIN || viewerRole == UserType.EVENT_COORDINATOR) {
            return true;
        }
        if (viewerId == null) {
            return false;
        }
        return teamMemberRepository.findByTeamIdAndUserId(teamId, viewerId).isPresent();
    }

    private List<HackathonSkillRole> normalizeNeededRoles(List<HackathonSkillRole> roles) {
        if (roles == null || roles.isEmpty()) {
            return List.of();
        }
        Set<HackathonSkillRole> unique = new LinkedHashSet<>(roles);
        if (unique.size() > maxSkillRoles) {
            throw new BusinessException("At most " + maxSkillRoles + " needed roles are allowed", HttpStatus.BAD_REQUEST) {};
        }
        if (unique.contains(null)) {
            throw new BusinessException("Needed roles cannot contain null values", HttpStatus.BAD_REQUEST) {};
        }
        return List.copyOf(unique);
    }
}
