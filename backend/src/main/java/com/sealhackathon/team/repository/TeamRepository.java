package com.sealhackathon.team.repository;

import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {

    boolean existsByEventIdAndName(UUID eventId, String name);

    List<Team> findByEventId(UUID eventId);

    Page<Team> findByEventId(UUID eventId, Pageable pageable);

    List<Team> findByEventIdAndStatus(UUID eventId, TeamStatus status);

    Optional<Team> findByEventIdAndLeaderId(UUID eventId, UUID leaderId);
}
