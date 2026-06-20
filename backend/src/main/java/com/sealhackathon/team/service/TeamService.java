package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.request.CreateTeamRequest;
import com.sealhackathon.team.dto.request.JoinTeamRequest;
import com.sealhackathon.team.dto.response.TeamMemberResponse;
import com.sealhackathon.team.dto.response.TeamResponse;
import com.sealhackathon.team.event.MemberJoinedEvent;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final EventPublicService eventPublicService;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    private static final int MIN_TEAM_SIZE = 3;
    private static final int MAX_TEAM_SIZE = 5;

    // ── BR-15, BR-16: Create team (form 1 — create new) ──
    @Transactional
    public TeamResponse createTeam(UUID currentUserId, CreateTeamRequest request) {
        validateEventActive(request.getEventId());
        validateRegistrationOpen(request.getEventId());

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

        return toResponse(team);
    }

    // ── BR-16: Join team (form 2 — join existing) ──
    @Transactional
    public TeamResponse joinTeam(UUID currentUserId, JoinTeamRequest request) {
        Team team = getTeam(request.getTeamId());
        validateEventActive(team.getEventId());
        validateRegistrationOpen(team.getEventId());

        // BR-18
        if (teamMemberRepository.existsByUserIdAndEventId(currentUserId, team.getEventId())) {
            throw new BusinessException(
                    "You are already a member of a team in this event",
                    HttpStatus.CONFLICT) {};
        }

        // BR-15: max 5
        int currentSize = teamMemberRepository.countByTeamId(team.getId());
        if (currentSize >= MAX_TEAM_SIZE) {
            throw new BusinessException("Team is full (maximum " + MAX_TEAM_SIZE + " members)",
                    HttpStatus.BAD_REQUEST) {};
        }

        TeamMember member = TeamMember.builder()
                .team(team)
                .userId(currentUserId)
                .role(TeamMemberRole.MEMBER)
                .joinedAt(LocalDateTime.now())
                .build();
        teamMemberRepository.save(member);

        eventPublisher.publishEvent(new MemberJoinedEvent(
                team.getId(), currentUserId, TeamMemberRole.MEMBER));

        // BR-22: auto-confirm when reaching MIN_TEAM_SIZE
        checkAndConfirmTeam(team);

        return toResponse(team);
    }

    // ── Remove member (leader action) ──
    @Transactional
    public TeamResponse removeMember(UUID leaderId, UUID teamId, UUID memberId) {
        Team team = getTeam(teamId);
        guardLeader(team, leaderId);

        if (memberId.equals(leaderId)) {
            throw new BusinessException("Leader cannot remove themselves. Transfer leadership first.",
                    HttpStatus.BAD_REQUEST) {};
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, memberId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamMember", "userId", memberId));

        teamMemberRepository.delete(member);
        eventPublisher.publishEvent(new MemberLeftEvent(teamId, memberId));

        // Revert to FORMING if below min
        updateTeamStatus(team);

        return toResponse(team);
    }

    // ── Leave team (member action) ──
    @Transactional
    public void leaveTeam(UUID currentUserId, UUID teamId) {
        Team team = getTeam(teamId);

        if (currentUserId.equals(team.getLeaderId())) {
            throw new BusinessException(
                    "Leader cannot leave the team. Transfer leadership or disband the team.",
                    HttpStatus.BAD_REQUEST) {};
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamMember", "userId", currentUserId));

        teamMemberRepository.delete(member);
        eventPublisher.publishEvent(new MemberLeftEvent(teamId, currentUserId));
        updateTeamStatus(team);
    }

    // ── Transfer leadership — BR-20 ──
    @Transactional
    public TeamResponse transferLeadership(UUID currentLeaderId, UUID teamId, UUID newLeaderId) {
        Team team = getTeam(teamId);
        guardLeader(team, currentLeaderId);

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

        return toResponse(team);
    }

    @Transactional(readOnly = true)
    public TeamResponse getTeamById(UUID teamId) {
        return toResponse(getTeam(teamId));
    }

    @Transactional(readOnly = true)
    public TeamResponse getMyTeam(UUID userId, UUID eventId) {
        UUID teamId = teamMemberRepository.findTeamIdByUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "userId+eventId",
                        userId + " in event " + eventId));
        return toResponse(getTeam(teamId));
    }

    @Transactional(readOnly = true)
    public Page<TeamResponse> getTeamsByEvent(UUID eventId, Pageable pageable) {
        return teamRepository.findByEventId(eventId, pageable).map(this::toResponse);
    }

    // ═══ Helpers ═══

    Team getTeam(UUID teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
    }

    private void checkAndConfirmTeam(Team team) {
        int size = teamMemberRepository.countByTeamId(team.getId());
        if (size >= MIN_TEAM_SIZE && team.getStatus() == TeamStatus.FORMING) {
            team.setStatus(TeamStatus.CONFIRMED);
            teamRepository.save(team);
            eventPublisher.publishEvent(new TeamConfirmedEvent(team.getId(), size));
        }
    }

    private void updateTeamStatus(Team team) {
        int size = teamMemberRepository.countByTeamId(team.getId());
        if (size < MIN_TEAM_SIZE && team.getStatus() == TeamStatus.CONFIRMED) {
            team.setStatus(TeamStatus.FORMING);
            teamRepository.save(team);
        }
    }

    private void guardLeader(Team team, UUID userId) {
        if (!team.getLeaderId().equals(userId)) {
            throw new BusinessException("Only the team leader can perform this action",
                    HttpStatus.FORBIDDEN) {};
        }
    }

    private void validateEventActive(UUID eventId) {
        if (!eventPublicService.isEventActive(eventId)) {
            throw new BusinessException("Event is not active", HttpStatus.BAD_REQUEST) {};
        }
    }

    private void validateRegistrationOpen(UUID eventId) {
        LocalDateTime deadline = eventPublicService.getRegistrationDeadline(eventId);
        if (LocalDateTime.now().isAfter(deadline)) {
            throw new BusinessException("Registration deadline has passed", HttpStatus.BAD_REQUEST) {};
        }
    }

    TeamResponse toResponse(Team team) {
        List<TeamMember> members = teamMemberRepository.findByTeamId(team.getId());
        List<TeamMemberResponse> memberResponses = members.stream()
                .map(tm -> {
                    UserSnapshot user = userPublicService.findById(tm.getUserId()).orElse(null);
                    return TeamMemberResponse.builder()
                            .id(tm.getId())
                            .userId(tm.getUserId())
                            .fullName(user != null ? user.getFullName() : null)
                            .email(user != null ? user.getEmail() : null)
                            .role(tm.getRole())
                            .joinedAt(tm.getJoinedAt())
                            .build();
                })
                .toList();

        return TeamResponse.builder()
                .id(team.getId())
                .eventId(team.getEventId())
                .name(team.getName())
                .leaderId(team.getLeaderId())
                .status(team.getStatus())
                .memberCount(memberResponses.size())
                .members(memberResponses)
                .createdAt(team.getCreatedAt())
                .build();
    }

    private TeamMember findByTeamIdAndUserId(UUID teamId, UUID userId) {
        return teamMemberRepository.findByTeamId(teamId).stream()
                .filter(m -> m.getUserId().equals(userId))
                .findFirst()
                .orElse(null);
    }
}
