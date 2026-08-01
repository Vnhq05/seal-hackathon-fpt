package com.sealhackathon.team.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

/**
 * Expires leftover invitations / join requests when a team has no free slots left.
 *
 * <p>Must not run {@code REQUIRES_NEW} status updates while the caller still holds
 * {@code SELECT … FOR UPDATE} on {@code teams}: PostgreSQL takes {@code FOR KEY SHARE}
 * on the parent row when updating child FK rows, which deadlocks against {@code FOR UPDATE}.
 * Schedule cleanup for {@code afterCompletion} so the team row lock is released first.
 */
@Component
@RequiredArgsConstructor
public class TeamCapacityCleanup {

    private final InvitationStatusService invitationStatusService;
    private final JoinRequestStatusService joinRequestStatusService;

    /**
     * Expire pending invites and reject pending join requests after the current transaction
     * releases its locks (or immediately when no TX synchronization is active — e.g. unit tests).
     */
    public void expirePendingAfterUnlock(UUID teamId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            runCleanup(teamId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                runCleanup(teamId);
            }
        });
    }

    private void runCleanup(UUID teamId) {
        invitationStatusService.expireAllPendingForTeam(teamId);
        joinRequestStatusService.rejectAllPendingForTeam(teamId);
    }
}
