package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.team.domain.Invitation;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.InvitationStatus;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.dto.request.SendInvitationRequest;
import com.sealhackathon.team.dto.response.InvitationResponse;
import com.sealhackathon.team.event.InvitationAcceptedEvent;
import com.sealhackathon.team.event.InvitationSentEvent;
import com.sealhackathon.team.event.MemberJoinedEvent;
import com.sealhackathon.team.event.TeamConfirmedEvent;
import com.sealhackathon.team.repository.InvitationRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final InvitationStatusService invitationStatusService;
    private final JoinRequestStatusService joinRequestStatusService;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;
    private final EventEnrollmentService enrollmentService;
    private final TeamService teamService;

    private static final String TEAM_FULL_MESSAGE =
            "Team has reached the maximum number of members";

    @Value("${app.hackathon.team.invitation-expiry-days:7}")
    private int invitationExpiryDays;

    // ── BR-21: Send invitation ──
    @Transactional
    public InvitationResponse sendInvitation(UUID leaderId, UUID teamId, SendInvitationRequest request) {
        Team team = getTeam(teamId);
        teamService.validateMemberChangesAllowed(team.getEventId());
        guardLeader(team, leaderId);

        int maxSize = teamService.resolveMaxTeamMembers(team.getEventId());
        int currentSize = teamMemberRepository.countByTeamId(teamId);
        if (currentSize >= maxSize) {
            throw new BusinessException(TEAM_FULL_MESSAGE, HttpStatus.BAD_REQUEST) {};
        }

        String inviteeEmail = resolveInviteeEmail(request);

        if (invitationRepository.existsByTeamIdAndInviteeEmailAndStatus(
                teamId, inviteeEmail, InvitationStatus.PENDING)) {
            throw new DuplicateResourceException("Invitation", "email", inviteeEmail);
        }

        // Check invitee exists
        UserSnapshot invitee = userPublicService.findByEmail(inviteeEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", inviteeEmail));

        // Invitee must be on the waiting list (approved enrollment, no team)
        enrollmentService.requireOnWaitingList(invitee.getId(), team.getEventId());

        if (enrollmentService.hasActiveEnrollmentInOtherEvent(invitee.getId(), team.getEventId())) {
            throw new BusinessException("User is enrolled in another event",
                    HttpStatus.CONFLICT) {};
        }

        Invitation invitation = Invitation.builder()
                .team(team)
                .inviterId(leaderId)
                .inviteeEmail(inviteeEmail)
                .status(InvitationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusDays(invitationExpiryDays))
                .build();

        invitation = invitationRepository.save(invitation);

        eventPublisher.publishEvent(new InvitationSentEvent(
                invitation.getId(), teamId, inviteeEmail));

        return toResponse(invitation);
    }

    private String resolveInviteeEmail(SendInvitationRequest request) {
        if (request.getInviteeUserId() != null) {
            return userPublicService.findById(request.getInviteeUserId())
                    .map(UserSnapshot::getEmail)
                    .map(String::toLowerCase)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User", "id", request.getInviteeUserId()));
        }
        if (request.getInviteeEmail() == null || request.getInviteeEmail().isBlank()) {
            throw new BusinessException("Invitee email or user id is required", HttpStatus.BAD_REQUEST) {};
        }
        return request.getInviteeEmail().trim().toLowerCase();
    }

    // ── BR-21: Accept invitation ──
    @Transactional
    public InvitationResponse acceptInvitation(UUID userId, UUID invitationId) {
        Invitation invitation = getInvitation(invitationId);
        validatePendingInvitation(invitation);

        UserSnapshot user = userPublicService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!user.getEmail().equals(invitation.getInviteeEmail())) {
            throw new BusinessException("This invitation is not for you", HttpStatus.FORBIDDEN) {};
        }

        Team team = teamRepository.findByIdForUpdate(invitation.getTeam().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", invitation.getTeam().getId()));
        teamService.validateMemberChangesAllowed(team.getEventId());
        enrollmentService.requireApprovedEnrollment(userId, team.getEventId());

        if (enrollmentService.hasActiveEnrollmentInOtherEvent(userId, team.getEventId())) {
            throw new BusinessException(
                    "You are already enrolled in another event",
                    HttpStatus.CONFLICT) {};
        }

        int maxSize = teamService.resolveMaxTeamMembers(team.getEventId());
        int minSize = teamService.resolveMinTeamMembers(team.getEventId());
        int currentSize = teamMemberRepository.countByTeamId(team.getId());
        if (currentSize >= maxSize) {
            // REQUIRES_NEW so status survives the throw below
            invitationStatusService.expireAllPendingForTeam(team.getId());
            joinRequestStatusService.rejectAllPendingForTeam(team.getId());
            throw new BusinessException(TEAM_FULL_MESSAGE, HttpStatus.BAD_REQUEST) {};
        }

        // BR-18 — disbanded teams don't count
        if (teamMemberRepository.existsActiveByUserIdAndEventId(userId, team.getEventId())) {
            throw new BusinessException("You are already in a team for this event",
                    HttpStatus.CONFLICT) {};
        }
        // Leftover membership on a disbanded team blocks the unique (event_id, user_id) row — clear it
        teamMemberRepository.findByUserIdAndEventId(userId, team.getEventId())
                .ifPresent(teamMemberRepository::delete);
        teamMemberRepository.flush();

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);

        TeamMember member = TeamMember.builder()
                .team(team)
                .eventId(team.getEventId())
                .userId(userId)
                .role(TeamMemberRole.MEMBER)
                .joinedAt(LocalDateTime.now())
                .build();
        teamMemberRepository.save(member);

        eventPublisher.publishEvent(new MemberJoinedEvent(
                team.getId(), userId, TeamMemberRole.MEMBER));

        // BR-22: auto-confirm
        int newSize = currentSize + 1;
        if (newSize >= minSize && team.getStatus() == FORMING) {
            team.setStatus(CONFIRMED);
            teamRepository.save(team);
            eventPublisher.publishEvent(new TeamConfirmedEvent(team.getId(), newSize));
        }

        if (newSize >= maxSize) {
            // Same TX: accepted invite already ACCEPTED; expire leftover PENDING invites / join requests
            invitationRepository.findByTeamIdAndStatus(team.getId(), InvitationStatus.PENDING)
                    .forEach(pending -> pending.setStatus(InvitationStatus.EXPIRED));
            joinRequestStatusService.rejectAllPendingForTeam(team.getId());
            teamService.syncRecruitingStatus(team.getId());
        }

        teamService.notifyTeamCountChanged(team.getEventId());

        eventPublisher.publishEvent(new InvitationAcceptedEvent(
                invitation.getId(), team.getId(), team.getLeaderId(), team.getName(),
                user.getFullName()));

        return toResponse(invitation);
    }

    // ── BR-21: Reject invitation ──
    @Transactional
    public InvitationResponse rejectInvitation(UUID userId, UUID invitationId) {
        Invitation invitation = getInvitation(invitationId);
        validatePendingInvitation(invitation);

        UserSnapshot user = userPublicService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!user.getEmail().equals(invitation.getInviteeEmail())) {
            throw new BusinessException("This invitation is not for you", HttpStatus.FORBIDDEN) {};
        }

        invitation.setStatus(InvitationStatus.REJECTED);
        invitationRepository.save(invitation);
        return toResponse(invitation);
    }

    // ── BR-21: Cancel invitation (leader only) ──
    @Transactional
    public InvitationResponse cancelInvitation(UUID leaderId, UUID invitationId) {
        Invitation invitation = getInvitation(invitationId);
        validatePendingInvitation(invitation);
        guardLeader(invitation.getTeam(), leaderId);

        invitation.setStatus(InvitationStatus.CANCELLED);
        invitationRepository.save(invitation);
        return toResponse(invitation);
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> getMyPendingInvitations(UUID userId) {
        UserSnapshot user = userPublicService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return invitationRepository.findByInviteeEmailAndStatus(
                        user.getEmail(), InvitationStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> getTeamInvitations(UUID teamId) {
        return invitationRepository.findByTeamId(teamId).stream()
                .map(this::toResponse)
                .toList();
    }

    // ═══ Helpers ═══

    private Invitation getInvitation(UUID invitationId) {
        return invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", "id", invitationId));
    }

    private Team getTeam(UUID teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
    }

    private void guardLeader(Team team, UUID userId) {
        if (!team.getLeaderId().equals(userId)) {
            throw new BusinessException("Only the team leader can send invitations",
                    HttpStatus.FORBIDDEN) {};
        }
    }

    private void validatePendingInvitation(Invitation invitation) {
        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BusinessException("Invitation is no longer pending. Status: " + invitation.getStatus(),
                    HttpStatus.BAD_REQUEST) {};
        }

        if (invitation.getExpiresAt() != null && invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            // Own transaction: the throw below would otherwise roll the status back and the row
            // would stay PENDING forever -- still listed for the invitee, and still blocking any
            // re-invite via the duplicate guard in sendInvitation.
            invitationStatusService.retire(invitation.getId(), InvitationStatus.EXPIRED);
            throw new BusinessException("Invitation has expired", HttpStatus.BAD_REQUEST) {};
        }
    }

    private InvitationResponse toResponse(Invitation inv) {
        return InvitationResponse.builder()
                .id(inv.getId())
                .teamId(inv.getTeam().getId())
                .teamName(inv.getTeam().getName())
                .inviterId(inv.getInviterId())
                .inviteeEmail(inv.getInviteeEmail())
                .status(inv.getStatus())
                .expiresAt(inv.getExpiresAt())
                .createdAt(inv.getCreatedAt())
                .build();
    }
}
