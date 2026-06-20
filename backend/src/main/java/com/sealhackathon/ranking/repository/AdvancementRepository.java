package com.sealhackathon.ranking.repository;

import com.sealhackathon.ranking.domain.Advancement;
import com.sealhackathon.ranking.domain.enums.AdvancementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AdvancementRepository extends JpaRepository<Advancement, UUID> {

    List<Advancement> findByRoundId(UUID roundId);

    List<Advancement> findByRoundIdAndStatus(UUID roundId, AdvancementStatus status);

    Optional<Advancement> findByTeamIdAndRoundId(UUID teamId, UUID roundId);

    void deleteByRoundId(UUID roundId);
}
