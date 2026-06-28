package com.sealhackathon.ranking.repository;

import com.sealhackathon.ranking.domain.FinalistSelection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FinalistSelectionRepository extends JpaRepository<FinalistSelection, UUID> {

    List<FinalistSelection> findByEventIdOrderByPreliminaryRankAsc(UUID eventId);

    void deleteByEventId(UUID eventId);

    boolean existsByEventIdAndTeamId(UUID eventId, UUID teamId);

    Optional<FinalistSelection> findByEventIdAndTeamId(UUID eventId, UUID teamId);
}
