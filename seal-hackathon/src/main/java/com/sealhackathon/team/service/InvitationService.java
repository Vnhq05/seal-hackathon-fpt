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
import com.sealhackathon.team.event.InvitationSentEvent;
import com.sealhackathon.team.event.MemberJoinedEvent;
import com.sealhackathon.team.event.TeamConfirmedEvent;
import com.sealhackathon.team.repository.InvitationRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
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
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    private static final int MAX_TEAM_SIZE = 5;
    private static final int MIN_TEAM_SIZE = 3;

    // ── BR-21: Send invitation ──
    @Transactional
    public InvitationResponse sendInvitation(UUID leaderId, UUID teamId, SendInvitationRequest request) {
        Team team = getTeam(teamId);
        guardLeader(team, leaderId);

        int currentSize = teamMemberRepository.countByTeamId(teamId);
        if (currentSize >= MAX_TEAM_SIZE) {
            throw new BusinessException("Team is already full", HttpStatus.BAD_REQUEST) {};
        }

        if (invitationRepository.existsByTeamIdAndInviteeEmailAndStatus(
                teamId, request.getInviteeEmail(), InvitationStatus.PENDING)) {
            throw new DuplicateResourceException("Invitation", "email", request.getInviteeEmail());
        }

        // Check invitee exists
        UserSnapshot invitee = userPublicService.findByEmail(request.getInviteeEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getInviteeEmail()));

        // BR-18: invitee must not be in another team for same event
        if (teamMemberRepository.existsByUserIdAndEventId(invitee.getId(), team.getEventId())) {
            throw new BusinessException("User is already in a team for this event",
                    HttpStatus.CONFLICT) {};
        }

        Invitation invitation = Invitation.builder()
                .team(team)
                .inviterId(leaderId)
                .inviteeEmail(request.getInviteeEmail())
                .status(InvitationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        invitation = invitationRepository.save(invitation);

        eventPublisher.publishEvent(new InvitationSentEvent(
                invitation.getId(), teamId, request.getInviteeEmail()));

        return toResponse(invitation);
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

        Team team = invitation.getTeam();
        int currentSize = teamMemberRepository.countByTeamId(team.getId());
        if (currentSize >= MAX_TEAM_SIZE) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new BusinessException("Team is already full", HttpStatus.BAD_REQUEST) {};
        }

        // BR-18
        if (teamMemberRepository.existsByUserIdAndEventId(userId, team.getEventId())) {
            throw new BusinessException("You are already in a team for this event",
                    HttpStatus.CONFLICT) {};
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);

        TeamMember member = TeamMember.builder()
                .team(team)
                .userId(userId)
                .role(TeamMemberRole.MEMBER)
                .joinedAt(LocalDateTime.now())
                .build();
        teamMemberRepository.save(member);

        eventPublisher.publishEvent(new MemberJoinedEvent(
                team.getId(), userId, TeamMemberRole.MEMBER));

        // BR-22: auto-confirm
        int newSize = currentSize + 1;
        if (newSize >= MIN_TEAM_SIZE && team.getStatus() == FORMING) {
            team.setStatus(CONFIRMED);
            teamRepository.save(team);
            eventPublisher.publishEvent(new TeamConfirmedEvent(team.getId(), newSize));
        }

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
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
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
