package com.sealhackathon.team.repository;

import com.sealhackathon.team.domain.TeamJoinRequest;
import com.sealhackathon.team.domain.enums.JoinRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamJoinRequestRepository extends JpaRepository<TeamJoinRequest, UUID> {

    List<TeamJoinRequest> findByTeamIdAndStatus(UUID teamId, JoinRequestStatus status);

    List<TeamJoinRequest> findByTeamId(UUID teamId);

    List<TeamJoinRequest> findByRequesterIdAndEventId(UUID requesterId, UUID eventId);

    boolean existsByRequesterIdAndEventIdAndStatus(UUID requesterId, UUID eventId, JoinRequestStatus status);

    Optional<TeamJoinRequest> findByIdAndEventId(UUID id, UUID eventId);
}
