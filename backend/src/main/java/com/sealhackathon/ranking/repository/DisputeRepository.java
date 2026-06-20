package com.sealhackathon.ranking.repository;

import com.sealhackathon.ranking.domain.Dispute;
import com.sealhackathon.ranking.domain.enums.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {

    List<Dispute> findByRoundId(UUID roundId);

    List<Dispute> findByRoundIdAndStatus(UUID roundId, DisputeStatus status);

    List<Dispute> findByTeamId(UUID teamId);
}
