package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface HackathonEventRepository extends JpaRepository<HackathonEvent, UUID> {

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, UUID id);

    Page<HackathonEvent> findByStatus(EventStatus status, Pageable pageable);

    boolean existsByScoringTemplateId(UUID scoringTemplateId);

    @EntityGraph(attributePaths = {"rounds", "tracks", "prizes", "honoredGuests", "mentorAssignments"})
    @Query("SELECT e FROM HackathonEvent e WHERE e.id = :id")
    Optional<HackathonEvent> findByIdWithDetails(UUID id);

    @Query("SELECT e FROM HackathonEvent e WHERE "
            + "(:status IS NULL OR e.status = :status) "
            + "AND (:season IS NULL OR e.season = :season) "
            + "AND (:year IS NULL OR e.year = :year)")
    Page<HackathonEvent> findByFilters(EventStatus status, String season, Integer year, Pageable pageable);

    @Query("SELECT e FROM HackathonEvent e WHERE e.createdBy = :createdBy "
            + "AND (:status IS NULL OR e.status = :status) "
            + "AND (:season IS NULL OR e.season = :season) "
            + "AND (:year IS NULL OR e.year = :year)")
    Page<HackathonEvent> findByCreatedByAndFilters(String createdBy, EventStatus status, String season, Integer year, Pageable pageable);
}
