package com.sealhackathon.team.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.common.service.SystemConfigService;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.HackathonSkillRole;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.request.CreateTeamRequest;
import com.sealhackathon.team.dto.request.JoinTeamRequest;
import com.sealhackathon.team.dto.request.SelectTrackRequest;
import com.sealhackathon.team.dto.request.UpdateTeamRecruitmentRequest;
import com.sealhackathon.team.dto.response.TeamMemberResponse;
import com.sealhackathon.team.dto.response.TeamResponse;
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

    private int getMinTeamSize() {
        return systemConfigService.getConfig().getMinTeamMembers();
    }

    private int getMaxTeamSize() {
        return systemConfigService.getConfig().getMaxTeamMembers();
    }

    // ── BR-15, BR-16: Create team (form 1 — create new) ──
    @Transactional
    public TeamResponse createTeam(UUID currentUserId, CreateTeamRequest request) {
        validateTeamFormationAllowed(request.getEventId());
        validateRegistrationOpen(request.getEventId());
        validateTeamCapacity(request.getEventId());
        enrollmentService.requireApprovedEnrollment(currentUserId, request.getEventId());

        // BR-19: team name unique per event
        if (teamRepository.existsByEventIdAndName(request.getEventId(), request.getName())) {
            throw new DuplicateResourceException("Team", "name", request.getName());
        }

        // BR-18: participant can only be in one team per event
        if (teamMemberRepository.existsByUserIdAndEventId(currentUserId, request.getEventId())) {
            throw new BusinessException(
                    "You are already a member of a team in this event",
                    HttpStatus.CONFLICT) {};
        }

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
        int maxSize = getMaxTeamSize();

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
        if (memberCount >= getMaxTeamSize() && team.isRecruiting()) {
            team.setRecruiting(false);
            teamRepository.save(team);
        }
    }

    // ── BR-16: Direct join deprecated — use join-request flow ──
    @Deprecated
    @Transactional
    public TeamResponse joinTeam(UUID currentUserId, JoinTeamRequest request) {
        throw new BusinessException(
                "Direct team join is no longer supported. Submit a join request instead.",
                HttpStatus.GONE) {};
    }

    @Transactional
    public TeamResponse selectTrack(UUID leaderId, UUID teamId, SelectTrackRequest request) {
        Team team = getTeam(teamId);
        formatRuleEngine.validateLeaderCannotSelectTrack(team.getEventId());
        guardLeader(team, leaderId);

        int size = teamMemberRepository.countByTeamId(teamId);
        int minSize = getMinTeamSize();
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
        teamRepository.save(team);
        return toResponse(team, leaderId, null);
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
    @Transactional
    public void leaveTeam(UUID currentUserId, UUID teamId) {
        throw new BusinessException(
                "Direct leave is not supported. Submit a leave request to the organizer.",
                HttpStatus.GONE) {};
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
                && teamRepository.existsByEventIdAndName(team.getEventId(), trimmedName)) {
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
        UUID teamId = teamMemberRepository.findTeamIdByUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "userId+eventId",
                        userId + " in event " + eventId));
        return toResponse(getTeam(teamId), userId, null, false);
    }

    @Transactional(readOnly = true)
    public Page<TeamResponse> getTeamsByEvent(
            UUID eventId, UUID viewerId, UserType viewerRole, Pageable pageable) {
        return teamRepository.findByEventId(eventId, pageable)
                .map(team -> toResponse(team, viewerId, viewerRole, true));
    }

    // ═══ Helpers ═══

    Team getTeam(UUID teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
    }

    private void checkAndConfirmTeam(Team team) {
        int size = teamMemberRepository.countByTeamId(team.getId());
        if (size >= getMinTeamSize() && team.getStatus() == TeamStatus.FORMING) {
            team.setStatus(TeamStatus.CONFIRMED);
            teamRepository.save(team);
            eventPublisher.publishEvent(new TeamConfirmedEvent(team.getId(), size));
        }
    }

    private void updateTeamStatus(Team team) {
        int size = teamMemberRepository.countByTeamId(team.getId());
        if (size < getMinTeamSize() && team.getStatus() == TeamStatus.CONFIRMED) {
            team.setStatus(TeamStatus.FORMING);
            teamRepository.save(team);
        }
        if (size >= getMaxTeamSize() && team.isRecruiting()) {
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
        HackathonEvent event = eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
        if (event.getMaxTeam() == null) {
            return;
        }
        long teamCount = teamRepository.countByEventId(eventId);
        if (teamCount >= event.getMaxTeam()) {
            throw new BusinessException(
                    "Maximum team capacity (" + event.getMaxTeam() + ") has been reached",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void closeRegistrationIfMaxTeamsReached(UUID eventId) {
        HackathonEvent event = eventRepository.findById(eventId).orElse(null);
        if (event == null || event.getMaxTeam() == null) {
            return;
        }
        long teamCount = teamRepository.countByEventId(eventId);
        if (teamCount >= event.getMaxTeam()) {
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

        int minTeamMembers = getMinTeamSize();
        int maxTeamMembers = getMaxTeamSize();
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
                .memberCount(memberCount)
                .minTeamMembers(minTeamMembers)
                .maxTeamMembers(maxTeamMembers)
                .canSelectTrack(memberCount >= minTeamMembers && team.getTrackId() == null)
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
        if (unique.size() > 5) {
            throw new BusinessException("At most 5 needed roles are allowed", HttpStatus.BAD_REQUEST) {};
        }
        if (unique.contains(null)) {
            throw new BusinessException("Needed roles cannot contain null values", HttpStatus.BAD_REQUEST) {};
        }
        return List.copyOf(unique);
    }
}
