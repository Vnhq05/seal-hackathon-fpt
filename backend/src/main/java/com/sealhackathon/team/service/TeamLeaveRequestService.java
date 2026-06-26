package com.sealhackathon.team.service;

import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamLeaveRequest;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.LeaveRequestStatus;
import com.sealhackathon.team.dto.request.CreateLeaveRequestRequest;
import com.sealhackathon.team.dto.response.TeamLeaveRequestResponse;
import com.sealhackathon.team.event.LeaveRequestCreatedEvent;
import com.sealhackathon.team.event.LeaveRequestResolvedEvent;
import com.sealhackathon.team.event.MemberLeftEvent;
import com.sealhackathon.team.repository.TeamLeaveRequestRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.repository.UserRepository;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static com.sealhackathon.team.domain.enums.TeamStatus.CONFIRMED;
import static com.sealhackathon.team.domain.enums.TeamStatus.FORMING;

@Service
@RequiredArgsConstructor
public class TeamLeaveRequestService {

    private final TeamLeaveRequestRepository leaveRequestRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserPublicService userPublicService;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final com.sealhackathon.common.service.SystemConfigService systemConfigService;

    private int getMinTeamSize() {
        return systemConfigService.getConfig().getMinTeamMembers();
    }

    @Transactional
    public TeamLeaveRequestResponse createLeaveRequest(
            UUID userId, UUID eventId, UUID teamId, CreateLeaveRequestRequest request) {
        Team team = getTeam(teamId);
        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }

        if (userId.equals(team.getLeaderId())) {
            throw new BusinessException(
                    "Team leader cannot request to leave. Transfer leadership first.",
                    HttpStatus.BAD_REQUEST) {};
        }

        teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new BusinessException(
                        "You are not a member of this team", HttpStatus.BAD_REQUEST) {});

        if (leaveRequestRepository.existsByTeamIdAndUserIdAndStatus(
                teamId, userId, LeaveRequestStatus.PENDING)) {
            throw new BusinessException(
                    "You already have a pending leave request for this team",
                    HttpStatus.CONFLICT) {};
        }

        TeamLeaveRequest leaveRequest = TeamLeaveRequest.builder()
                .team(team)
                .eventId(eventId)
                .userId(userId)
                .status(LeaveRequestStatus.PENDING)
                .reason(request != null ? request.getReason() : null)
                .build();
        leaveRequest = leaveRequestRepository.save(leaveRequest);

        UserSnapshot user = userPublicService.findById(userId).orElse(null);
        List<UUID> coordinatorIds = findCoordinatorIds();

        eventPublisher.publishEvent(new LeaveRequestCreatedEvent(
                leaveRequest.getId(), teamId, eventId, userId, team.getName(),
                user != null ? user.getFullName() : null, coordinatorIds));

        return toResponse(leaveRequest);
    }

    @Transactional(readOnly = true)
    public List<TeamLeaveRequestResponse> getEventLeaveRequests(UUID eventId) {
        return leaveRequestRepository.findByEventIdAndStatus(eventId, LeaveRequestStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TeamLeaveRequestResponse> getTeamLeaveRequests(UUID leaderId, UUID eventId, UUID teamId) {
        Team team = getTeam(teamId);
        guardLeader(team, leaderId);
        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }
        return leaveRequestRepository.findByTeamIdAndStatus(teamId, LeaveRequestStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TeamLeaveRequestResponse approveLeaveRequest(UUID coordinatorId, UUID eventId, UUID leaveRequestId) {
        TeamLeaveRequest leaveRequest = getLeaveRequest(leaveRequestId, eventId);
        validatePending(leaveRequest);

        Team team = teamRepository.findByIdForUpdate(leaveRequest.getTeam().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", leaveRequest.getTeam().getId()));
        UUID userId = leaveRequest.getUserId();

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(team.getId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamMember", "userId", userId));

        teamMemberRepository.delete(member);
        eventPublisher.publishEvent(new MemberLeftEvent(team.getId(), userId));

        int size = teamMemberRepository.countByTeamId(team.getId());
        if (size < getMinTeamSize() && team.getStatus() == CONFIRMED) {
            team.setStatus(FORMING);
            teamRepository.save(team);
        }

        leaveRequest.setStatus(LeaveRequestStatus.APPROVED);
        leaveRequest.setResolvedBy(coordinatorId);
        leaveRequest.setResolvedAt(LocalDateTime.now());
        leaveRequestRepository.save(leaveRequest);

        eventPublisher.publishEvent(new LeaveRequestResolvedEvent(
                leaveRequestId, team.getId(), eventId, userId, team.getLeaderId(), team.getName(), true));

        return toResponse(leaveRequest);
    }

    @Transactional
    public TeamLeaveRequestResponse rejectLeaveRequest(UUID coordinatorId, UUID eventId, UUID leaveRequestId) {
        TeamLeaveRequest leaveRequest = getLeaveRequest(leaveRequestId, eventId);
        validatePending(leaveRequest);

        leaveRequest.setStatus(LeaveRequestStatus.REJECTED);
        leaveRequest.setResolvedBy(coordinatorId);
        leaveRequest.setResolvedAt(LocalDateTime.now());
        leaveRequestRepository.save(leaveRequest);

        Team team = leaveRequest.getTeam();
        eventPublisher.publishEvent(new LeaveRequestResolvedEvent(
                leaveRequestId, team.getId(), eventId, leaveRequest.getUserId(),
                team.getLeaderId(), team.getName(), false));

        return toResponse(leaveRequest);
    }

    private List<UUID> findCoordinatorIds() {
        return userRepository.findByUserType(UserType.EVENT_COORDINATOR, org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .filter(u -> u.getStatus() == AccountStatus.ACTIVE)
                .map(User::getId)
                .toList();
    }

    private TeamLeaveRequest getLeaveRequest(UUID leaveRequestId, UUID eventId) {
        return leaveRequestRepository.findByIdAndEventId(leaveRequestId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamLeaveRequest", "id", leaveRequestId));
    }

    private Team getTeam(UUID teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
    }

    private void guardLeader(Team team, UUID userId) {
        if (!team.getLeaderId().equals(userId)) {
            throw new BusinessException("Only the team leader can view team leave requests",
                    HttpStatus.FORBIDDEN) {};
        }
    }

    private void validatePending(TeamLeaveRequest leaveRequest) {
        if (leaveRequest.getStatus() != LeaveRequestStatus.PENDING) {
            throw new BusinessException("Leave request is no longer pending", HttpStatus.BAD_REQUEST) {};
        }
    }

    private TeamLeaveRequestResponse toResponse(TeamLeaveRequest lr) {
        UserSnapshot user = userPublicService.findById(lr.getUserId()).orElse(null);
        Team team = lr.getTeam();
        return TeamLeaveRequestResponse.builder()
                .id(lr.getId())
                .teamId(team.getId())
                .teamName(team.getName())
                .eventId(lr.getEventId())
                .userId(lr.getUserId())
                .userFullName(user != null ? user.getFullName() : null)
                .userEmail(user != null ? user.getEmail() : null)
                .status(lr.getStatus())
                .reason(lr.getReason())
                .createdAt(lr.getCreatedAt())
                .resolvedBy(lr.getResolvedBy())
                .resolvedAt(lr.getResolvedAt())
                .build();
    }
}
