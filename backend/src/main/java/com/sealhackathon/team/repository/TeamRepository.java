package com.sealhackathon.team.repository;

import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {

    boolean existsByEventIdAndName(UUID eventId, String name);

    /** Name uniqueness among live teams only — a disbanded team's name can be reused. */
    boolean existsByEventIdAndNameAndStatusNot(UUID eventId, String name, TeamStatus status);

    List<Team> findByEventId(UUID eventId);

    Page<Team> findByEventId(UUID eventId, Pageable pageable);

    List<Team> findByEventIdAndStatus(UUID eventId, TeamStatus status);

    long countByEventId(UUID eventId);

    long countByEventIdAndStatusNot(UUID eventId, TeamStatus status);

    long countByEventIdAndTrackId(UUID eventId, UUID trackId);

    List<Team> findByEventIdAndTrackIdIsNull(UUID eventId);

    List<Team> findByEventIdAndTrackId(UUID eventId, UUID trackId);

    List<Team> findByGroupId(UUID groupId);

    List<Team> findByEventIdAndGroupId(UUID eventId, UUID groupId);

    Optional<Team> findByEventIdAndLeaderId(UUID eventId, UUID leaderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Team t WHERE t.id = :id")
    Optional<Team> findByIdForUpdate(@Param("id") UUID id);

    /** Groups with no teams yield no row — callers must default them to zero. */
    @Query("SELECT t.groupId, COUNT(t) FROM Team t "
            + "WHERE t.trackId = :trackId AND t.groupId IS NOT NULL GROUP BY t.groupId")
    List<Object[]> countByTrackIdGroupByGroup(@Param("trackId") UUID trackId);
}
