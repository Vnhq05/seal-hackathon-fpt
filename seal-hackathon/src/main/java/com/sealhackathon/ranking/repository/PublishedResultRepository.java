package com.sealhackathon.ranking.repository;

import com.sealhackathon.ranking.domain.PublishedResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PublishedResultRepository extends JpaRepository<PublishedResult, UUID> {

    Optional<PublishedResult> findByRoundId(UUID roundId);

    boolean existsByRoundId(UUID roundId);
}
