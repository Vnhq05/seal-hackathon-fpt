package com.sealhackathon.team.repository;

import com.sealhackathon.team.domain.TeamLeaveRequest;
import com.sealhackathon.team.domain.enums.LeaveRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamLeaveRequestRepository extends JpaRepository<TeamLeaveRequest, UUID> {

    List<TeamLeaveRequest> findByEventIdAndStatus(UUID eventId, LeaveRequestStatus status);

    List<TeamLeaveRequest> findByTeamIdAndStatus(UUID teamId, LeaveRequestStatus status);

    boolean existsByTeamIdAndUserIdAndStatus(UUID teamId, UUID userId, LeaveRequestStatus status);

    Optional<TeamLeaveRequest> findByIdAndEventId(UUID id, UUID eventId);
}
