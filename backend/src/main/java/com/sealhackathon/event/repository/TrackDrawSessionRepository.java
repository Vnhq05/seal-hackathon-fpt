package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.TrackDrawSession;
import com.sealhackathon.event.domain.enums.DrawSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TrackDrawSessionRepository extends JpaRepository<TrackDrawSession, UUID> {

    @Query("SELECT s FROM TrackDrawSession s LEFT JOIN FETCH s.queue WHERE s.eventId = :eventId")
    Optional<TrackDrawSession> findByEventIdWithQueue(@Param("eventId") UUID eventId);

    Optional<TrackDrawSession> findByEventId(UUID eventId);

    @Query("SELECT s FROM TrackDrawSession s LEFT JOIN FETCH s.queue WHERE s.eventId = :eventId AND s.status = :status")
    Optional<TrackDrawSession> findByEventIdAndStatusWithQueue(
            @Param("eventId") UUID eventId, @Param("status") DrawSessionStatus status);
}
