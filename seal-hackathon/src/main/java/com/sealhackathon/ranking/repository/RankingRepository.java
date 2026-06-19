package com.sealhackathon.ranking.repository;

import com.sealhackathon.ranking.domain.Ranking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RankingRepository extends JpaRepository<Ranking, UUID> {

    @Query("SELECT COALESCE(MAX(r.version), 0) FROM Ranking r WHERE r.roundId = :roundId")
    int findMaxVersionByRoundId(@Param("roundId") UUID roundId);

    List<Ranking> findByRoundIdAndVersionOrderByRankAsc(UUID roundId, Integer version);

    Optional<Ranking> findByTeamIdAndRoundIdAndVersion(UUID teamId, UUID roundId, Integer version);

    void deleteByRoundIdAndVersion(UUID roundId, Integer version);
}
