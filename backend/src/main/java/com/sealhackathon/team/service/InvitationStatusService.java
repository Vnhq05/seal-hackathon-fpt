package com.sealhackathon.team.service;

import com.sealhackathon.team.domain.enums.InvitationStatus;
import com.sealhackathon.team.repository.InvitationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * Callers must not have written to the row on the outer transaction first -- the row lock would
     * still be held and this new transaction would deadlock against it.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void retire(UUID invitationId, InvitationStatus status) {
        invitationRepository.findById(invitationId)
                .ifPresent(invitation -> invitation.setStatus(status));
    }
}
