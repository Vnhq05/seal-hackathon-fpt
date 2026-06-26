package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.EventStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.time.LocalDate;

@Repository
public interface HackathonEventRepository extends JpaRepository<HackathonEvent, UUID> {

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, UUID id);

    Page<HackathonEvent> findByStatus(EventStatus status, Pageable pageable);

    @Query("SELECT e FROM HackathonEvent e WHERE e.status <> com.sealhackathon.event.domain.enums.EventStatus.CANCELLED "
            + "AND EXISTS (SELECT 1 FROM Round r WHERE r.hackathonEvent = e)")
    Page<HackathonEvent> findPublishedEvents(Pageable pageable);

    boolean existsByScoringTemplateId(UUID scoringTemplateId);

    @Query("SELECT e FROM HackathonEvent e WHERE e.id = :id")
    Optional<HackathonEvent> findByIdWithDetails(UUID id);

    @Query("SELECT e FROM HackathonEvent e WHERE "
            + "(:status IS NULL OR e.status = :status) "
            + "AND (:season IS NULL OR UPPER(e.season) = UPPER(:season)) "
            + "AND (:year IS NULL OR e.year = :year)")
    Page<HackathonEvent> findByFilters(EventStatus status, String season, Integer year, Pageable pageable);

    @Query("SELECT e FROM HackathonEvent e WHERE e.createdBy = :createdBy "
            + "AND (:status IS NULL OR e.status = :status) "
            + "AND (:season IS NULL OR UPPER(e.season) = UPPER(:season)) "
            + "AND (:year IS NULL OR e.year = :year)")
    Page<HackathonEvent> findByCreatedByAndFilters(String createdBy, EventStatus status, String season, Integer year, Pageable pageable);

    @Query("SELECT e FROM HackathonEvent e WHERE e.startDate = :date "
            + "AND e.minTeam IS NOT NULL "
            + "AND e.status NOT IN (com.sealhackathon.event.domain.enums.EventStatus.CANCELLED, "
            + "com.sealhackathon.event.domain.enums.EventStatus.COMPLETED)")
    java.util.List<HackathonEvent> findStartingTodayWithMinTeam(@Param("date") LocalDate date);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM HackathonEvent e WHERE e.id = :id")
    Optional<HackathonEvent> findByIdForUpdate(@Param("id") UUID id);
}
