package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.CompetitionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompetitionGroupRepository extends JpaRepository<CompetitionGroup, UUID> {

    List<CompetitionGroup> findByTrackIdOrderByNameAsc(UUID trackId);

    boolean existsByTrackIdAndName(UUID trackId, String name);

    Optional<CompetitionGroup> findByIdAndTrackId(UUID id, UUID trackId);
}
