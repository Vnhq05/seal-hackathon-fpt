package com.sealhackathon.team.repository;

import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventEnrollmentRepository extends JpaRepository<EventEnrollment, UUID> {

    Optional<EventEnrollment> findByUserIdAndEventId(UUID userId, UUID eventId);

    boolean existsByUserIdAndEventId(UUID userId, UUID eventId);

    List<EventEnrollment> findByEventIdAndStatus(UUID eventId, EnrollmentStatus status);

    List<EventEnrollment> findByEventId(UUID eventId);

    @Query("SELECT COUNT(e) FROM EventEnrollment e WHERE e.userId = :userId AND e.status IN :statuses")
    long countByUserIdAndStatusIn(@Param("userId") UUID userId, @Param("statuses") List<EnrollmentStatus> statuses);

    @Query("SELECT e FROM EventEnrollment e WHERE e.eventId = :eventId AND e.status = 'APPROVED' " +
            "AND e.userId NOT IN (SELECT tm.userId FROM TeamMember tm JOIN tm.team t WHERE t.eventId = :eventId)")
    List<EventEnrollment> findWaitingList(@Param("eventId") UUID eventId);

    @Query("SELECT e FROM EventEnrollment e WHERE e.userId = :userId AND e.status IN :statuses")
    Optional<EventEnrollment> findByUserIdAndStatusIn(@Param("userId") UUID userId, @Param("statuses") List<EnrollmentStatus> statuses);
}
