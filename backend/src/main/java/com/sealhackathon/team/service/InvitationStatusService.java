package com.sealhackathon.team.service;

import com.sealhackathon.team.domain.Invitation;
import com.sealhackathon.team.domain.enums.InvitationStatus;
import com.sealhackathon.team.event.InvitationsExpiredDueToTeamFullEvent;
import com.sealhackathon.team.repository.InvitationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Retires an invitation in its own transaction.
 *
 * Callers discover an invitation is dead only while rejecting the request that touched it, so they
 * throw immediately afterwards. Writing the status on the caller's transaction meant the rollback
 * took it back, leaving the row PENDING forever -- and PENDING is what
 * {@code findByInviteeEmailAndStatus} and the duplicate guard in {@code sendInvitation} read.
 *
 * Separate bean rather than a method on InvitationService: a self-invocation would not pass through
 * the proxy and REQUIRES_NEW would be silently ignored. Same shape as EmailOtpAttemptService.
 */
@Service
@RequiredArgsConstructor
public class InvitationStatusService {

    private final InvitationRepository invitationRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Callers must not have written to the row on the outer transaction first -- the row lock would
     * still be held and this new transaction would deadlock against it.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void retire(UUID invitationId, InvitationStatus status) {
        invitationRepository.findById(invitationId)
                .ifPresent(invitation -> invitation.setStatus(status));
    }

    /**
     * Expires every PENDING invitation for a full team so invitees cannot accept a closed slot and
     * leaders are not left with stale pending invites to cancel.
     *
     * <p>Own transaction — call only when the caller does <em>not</em> hold {@code FOR UPDATE}
     * on the team row (see {@link TeamCapacityCleanup}).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void expireAllPendingForTeam(UUID teamId) {
        expireAllPendingForTeamInCurrentTx(teamId);
    }

    /** Same-TX variant for callers that already hold the team lock and will commit. */
    public void expireAllPendingForTeamInCurrentTx(UUID teamId) {
        List<Invitation> pending = invitationRepository.findByTeamIdAndStatus(
                teamId, InvitationStatus.PENDING);
        if (pending.isEmpty()) {
            return;
        }

        String teamName = pending.getFirst().getTeam().getName();
        List<String> inviteeEmails = pending.stream()
                .map(Invitation::getInviteeEmail)
                .distinct()
                .toList();

        pending.forEach(invitation -> invitation.setStatus(InvitationStatus.EXPIRED));

        eventPublisher.publishEvent(new InvitationsExpiredDueToTeamFullEvent(
                teamId, teamName, inviteeEmails));
    }
}
