package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamJoinRequest;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.HackathonSkillRole;
import com.sealhackathon.team.domain.enums.JoinRequestStatus;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.request.CreateJoinRequestRequest;
import com.sealhackathon.team.dto.response.JoinableTeamResponse;
import com.sealhackathon.team.dto.response.TeamJoinRequestResponse;
import com.sealhackathon.team.event.JoinRequestCreatedEvent;
import com.sealhackathon.team.event.JoinRequestResolvedEvent;
import com.sealhackathon.team.event.MemberJoinedEvent;
import com.sealhackathon.team.event.TeamConfirmedEvent;
import com.sealhackathon.team.repository.TeamJoinRequestRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.sealhackathon.team.domain.enums.TeamStatus.CONFIRMED;
import static com.sealhackathon.team.domain.enums.TeamStatus.FORMING;

@Service
@RequiredArgsConstructor
public class TeamJoinRequestService {

    private static final String TEAM_FULL_MESSAGE =
            "Team has reached the maximum number of members";

    private final TeamJoinRequestRepository joinRequestRepository;
    private final JoinRequestStatusService joinRequestStatusService;
    private final InvitationStatusService invitationStatusService;
    private final TeamCapacityCleanup teamCapacityCleanup;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final EventEnrollmentService enrollmentService;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;
    private final TeamService teamService;

    @Transactional(readOnly = true)
    public List<JoinableTeamResponse> getJoinableTeams(
            UUID eventId, UUID currentUserId, boolean recruitingOnly) {
        enrollmentService.requireApprovedEnrollment(currentUserId, eventId);

        if (teamMemberRepository.existsActiveByUserIdAndEventId(currentUserId, eventId)) {
            return List.of();
        }

        if (joinRequestRepository.existsByRequesterIdAndEventIdAndStatus(
                currentUserId, eventId, JoinRequestStatus.PENDING)) {
            return List.of();
        }

        int maxSize = teamService.resolveMaxTeamMembers(eventId);
        List<Team> teams = teamRepository.findByEventId(eventId).stream()
                .filter(t -> t.getStatus() != TeamStatus.DISBANDED)
                .filter(t -> teamMemberRepository.countByTeamId(t.getId()) < maxSize)
                .filter(t -> !recruitingOnly || t.isRecruiting())
                .toList();

        List<UUID> leaderIds = teams.stream().map(Team::getLeaderId).distinct().toList();
        Map<UUID, UserSnapshot> leaders = userPublicService.findAllByIds(leaderIds).stream()
                .collect(Collectors.toMap(UserSnapshot::getId, u -> u));

        return teams.stream()
                .map(t -> {
                    UserSnapshot leader = leaders.get(t.getLeaderId());
                    int memberCount = teamMemberRepository.countByTeamId(t.getId());
                    List<HackathonSkillRole> neededRoles =
                            t.getNeededRoles() != null ? List.copyOf(t.getNeededRoles()) : List.of();
                    return JoinableTeamResponse.builder()
                            .id(t.getId())
                            .name(t.getName())
                            .leaderId(t.getLeaderId())
                            .leaderFullName(leader != null ? leader.getFullName() : null)
                            .memberCount(memberCount)
                            .maxTeamMembers(maxSize)
                            .status(t.getStatus())
                            .isRecruiting(t.isRecruiting())
                            .recruitmentNote(t.getRecruitmentNote())
                            .neededRoles(neededRoles)
                            .build();
                })
                .toList();
    }

    @Transactional
    public TeamJoinRequestResponse createJoinRequest(
            UUID requesterId, UUID eventId, UUID teamId, CreateJoinRequestRequest request) {
        Team team = teamRepository.findByIdForUpdate(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }

        if (team.getStatus() == TeamStatus.DISBANDED) {
            throw new BusinessException("Team is disbanded", HttpStatus.BAD_REQUEST) {};
        }

        teamService.validateTeamFormationAllowed(eventId);
        teamService.validateRegistrationOpen(eventId);
        enrollmentService.requireApprovedEnrollment(requesterId, eventId);

        if (teamMemberRepository.existsActiveByUserIdAndEventId(requesterId, eventId)) {
            throw new BusinessException(
                    "You are already a member of a team in this event",
                    HttpStatus.CONFLICT) {};
        }

        if (joinRequestRepository.existsByRequesterIdAndEventIdAndStatus(
                requesterId, eventId, JoinRequestStatus.PENDING)) {
            throw new BusinessException(
                    "You already have a pending join request for this event",
                    HttpStatus.CONFLICT) {};
        }

        int currentSize = teamMemberRepository.countByTeamId(teamId);
        if (currentSize >= teamService.resolveMaxTeamMembers(eventId)) {
            throw new BusinessException(TEAM_FULL_MESSAGE, HttpStatus.BAD_REQUEST) {};
        }

        TeamJoinRequest joinRequest = TeamJoinRequest.builder()
                .team(team)
                .eventId(eventId)
                .requesterId(requesterId)
                .status(JoinRequestStatus.PENDING)
                .message(request != null ? request.getMessage() : null)
                .build();
        joinRequest = joinRequestRepository.save(joinRequest);

        eventPublisher.publishEvent(new JoinRequestCreatedEvent(
                joinRequest.getId(), teamId, eventId, requesterId, team.getName(), team.getLeaderId()));

        return toResponse(joinRequest);
    }

    @Transactional(readOnly = true)
    public List<TeamJoinRequestResponse> getTeamJoinRequests(UUID leaderId, UUID eventId, UUID teamId) {
        Team team = getTeam(teamId);
        guardLeader(team, leaderId);
        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }
        return joinRequestRepository.findByTeamIdAndStatus(teamId, JoinRequestStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TeamJoinRequestResponse> getMyJoinRequests(UUID requesterId, UUID eventId) {
        return joinRequestRepository.findByRequesterIdAndEventId(requesterId, eventId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TeamJoinRequestResponse acceptJoinRequest(UUID leaderId, UUID eventId, UUID joinRequestId) {
        TeamJoinRequest joinRequest = getJoinRequest(joinRequestId, eventId);
        Team team = teamRepository.findByIdForUpdate(joinRequest.getTeam().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", joinRequest.getTeam().getId()));
        guardLeader(team, leaderId);
        teamService.validateMemberChangesAllowed(eventId);
        validatePending(joinRequest);

        UUID requesterId = joinRequest.getRequesterId();

        if (teamMemberRepository.existsActiveByUserIdAndEventId(requesterId, eventId)) {
            // Defer REQUIRES_NEW retire — calling it while holding team FOR UPDATE deadlocks on FK
            UUID toReject = joinRequest.getId();
            deferAfterUnlock(() ->
                    joinRequestStatusService.retire(toReject, JoinRequestStatus.REJECTED));
            throw new BusinessException("User is already in a team for this event", HttpStatus.CONFLICT) {};
        }
        // Leftover membership on a disbanded team blocks the unique (event_id, user_id) row — clear it
        teamMemberRepository.findByUserIdAndEventId(requesterId, eventId)
                .ifPresent(teamMemberRepository::delete);
        teamMemberRepository.flush();

        int maxSize = teamService.resolveMaxTeamMembers(eventId);
        int minSize = teamService.resolveMinTeamMembers(eventId);
        int currentSize = teamMemberRepository.countByTeamId(team.getId());
        if (currentSize >= maxSize) {
            teamCapacityCleanup.expirePendingAfterUnlock(team.getId());
            throw new BusinessException(TEAM_FULL_MESSAGE, HttpStatus.BAD_REQUEST) {};
        }

        joinRequest.setStatus(JoinRequestStatus.ACCEPTED);
        joinRequest.setResolvedAt(LocalDateTime.now());
        joinRequestRepository.save(joinRequest);

        TeamMember member = TeamMember.builder()
                .team(team)
                .eventId(team.getEventId())
                .userId(requesterId)
                .role(TeamMemberRole.MEMBER)
                .joinedAt(LocalDateTime.now())
                .build();
        teamMemberRepository.save(member);

        eventPublisher.publishEvent(new MemberJoinedEvent(
                team.getId(), requesterId, TeamMemberRole.MEMBER));

        int newSize = currentSize + 1;
        if (newSize >= minSize && team.getStatus() == FORMING) {
            team.setStatus(CONFIRMED);
            teamRepository.save(team);
            eventPublisher.publishEvent(new TeamConfirmedEvent(team.getId(), newSize));
        }

        if (newSize >= maxSize) {
            joinRequestStatusService.rejectAllPendingForTeamInCurrentTx(team.getId());
            invitationStatusService.expireAllPendingForTeamInCurrentTx(team.getId());
        }

        teamService.notifyTeamCountChanged(eventId);
        teamService.syncRecruitingStatus(team.getId());

        eventPublisher.publishEvent(new JoinRequestResolvedEvent(
                joinRequestId, team.getId(), eventId, requesterId, team.getName(), true));

        return toResponse(joinRequest);
    }

    @Transactional
    public TeamJoinRequestResponse rejectJoinRequest(UUID leaderId, UUID eventId, UUID joinRequestId) {
        TeamJoinRequest joinRequest = getJoinRequest(joinRequestId, eventId);
        Team team = joinRequest.getTeam();
        guardLeader(team, leaderId);
        validatePending(joinRequest);

        joinRequest.setStatus(JoinRequestStatus.REJECTED);
        joinRequest.setResolvedAt(LocalDateTime.now());
        joinRequestRepository.save(joinRequest);

        eventPublisher.publishEvent(new JoinRequestResolvedEvent(
                joinRequestId, team.getId(), eventId, joinRequest.getRequesterId(), team.getName(), false));

        return toResponse(joinRequest);
    }

    @Transactional
    public TeamJoinRequestResponse cancelJoinRequest(UUID requesterId, UUID eventId, UUID joinRequestId) {
        TeamJoinRequest joinRequest = getJoinRequest(joinRequestId, eventId);
        if (!joinRequest.getRequesterId().equals(requesterId)) {
            throw new BusinessException("This join request is not yours", HttpStatus.FORBIDDEN) {};
        }
        validatePending(joinRequest);

        joinRequest.setStatus(JoinRequestStatus.CANCELLED);
        joinRequest.setResolvedAt(LocalDateTime.now());
        joinRequestRepository.save(joinRequest);

        return toResponse(joinRequest);
    }

    private TeamJoinRequest getJoinRequest(UUID joinRequestId, UUID eventId) {
        return joinRequestRepository.findByIdAndEventId(joinRequestId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamJoinRequest", "id", joinRequestId));
    }

    private Team getTeam(UUID teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
    }

    private void guardLeader(Team team, UUID userId) {
        if (!team.getLeaderId().equals(userId)) {
            throw new BusinessException("Only the team leader can perform this action",
                    HttpStatus.FORBIDDEN) {};
        }
    }

    private void validatePending(TeamJoinRequest joinRequest) {
        if (joinRequest.getStatus() != JoinRequestStatus.PENDING) {
            throw new BusinessException("Join request is no longer pending", HttpStatus.BAD_REQUEST) {};
        }
    }

    private void deferAfterUnlock(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                action.run();
            }
        });
    }

    private TeamJoinRequestResponse toResponse(TeamJoinRequest jr) {
        UserSnapshot requester = userPublicService.findById(jr.getRequesterId()).orElse(null);
        Team team = jr.getTeam();
        return TeamJoinRequestResponse.builder()
                .id(jr.getId())
                .teamId(team.getId())
                .teamName(team.getName())
                .eventId(jr.getEventId())
                .requesterId(jr.getRequesterId())
                .requesterFullName(requester != null ? requester.getFullName() : null)
                .requesterEmail(requester != null ? requester.getEmail() : null)
                .status(jr.getStatus())
                .message(jr.getMessage())
                .createdAt(jr.getCreatedAt())
                .resolvedAt(jr.getResolvedAt())
                .build();
    }
}
