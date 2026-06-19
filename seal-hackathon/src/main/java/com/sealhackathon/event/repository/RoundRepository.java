package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.Round;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface RoundRepository extends JpaRepository<Round, UUID> {

    List<Round> findByHackathonEventIdOrderByRoundNumberAsc(UUID eventId);

    boolean existsByHackathonEventIdAndRoundNumber(UUID eventId, Integer roundNumber);

    @Query("SELECT COUNT(r) > 0 FROM Round r WHERE r.hackathonEvent.id = :eventId " +
            "AND r.id != :excludeId " +
            "AND r.startDate < :endDate AND r.endDate > :startDate")
    boolean existsOverlappingRound(@Param("eventId") UUID eventId,
                                   @Param("excludeId") UUID excludeId,
                                   @Param("startDate") LocalDateTime startDate,
                                   @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(r) > 0 FROM Round r WHERE r.hackathonEvent.id = :eventId " +
            "AND r.startDate < :endDate AND r.endDate > :startDate")
    boolean existsOverlappingRoundForNew(@Param("eventId") UUID eventId,
                                         @Param("startDate") LocalDateTime startDate,
                                         @Param("endDate") LocalDateTime endDate);
}
