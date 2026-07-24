package com.sealhackathon.team.service;

import com.sealhackathon.team.domain.enums.JoinRequestStatus;
import com.sealhackathon.team.repository.TeamJoinRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Retires a join request in its own transaction. See {@link InvitationStatusService} -- same defect,
 * same reasoning: the status write was rolled back by the throw that immediately followed it, so a
 * request that could never be accepted stayed PENDING in the leader's queue.
 */
@Service
@RequiredArgsConstructor
public class JoinRequestStatusService {

    private final TeamJoinRequestRepository joinRequestRepository;

    /**
     * Callers must not have written to the row on the outer transaction first -- the row lock would
     * still be held and this new transaction would deadlock against it.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void retire(UUID joinRequestId, JoinRequestStatus status) {
        joinRequestRepository.findById(joinRequestId).ifPresent(request -> {
            request.setStatus(status);
            request.setResolvedAt(LocalDateTime.now());
        });
    }

    /**
     * Rejects every PENDING join request for a full team so leaders cannot accept/reject leftover
     * requests after the last slot is taken.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void rejectAllPendingForTeam(UUID teamId) {
        LocalDateTime now = LocalDateTime.now();
        joinRequestRepository.findByTeamIdAndStatus(teamId, JoinRequestStatus.PENDING)
                .forEach(request -> {
                    request.setStatus(JoinRequestStatus.REJECTED);
                    request.setResolvedAt(now);
                });
    }
}
