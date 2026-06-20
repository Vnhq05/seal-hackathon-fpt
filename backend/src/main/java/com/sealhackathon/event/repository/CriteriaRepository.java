package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.Criteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CriteriaRepository extends JpaRepository<Criteria, UUID> {

    List<Criteria> findByRoundIdOrderBySortOrderAsc(UUID roundId);

    @Query("SELECT COALESCE(SUM(c.weight), 0) FROM Criteria c WHERE c.round.id = :roundId")
    int sumWeightsByRoundId(@Param("roundId") UUID roundId);

    @Query("SELECT COALESCE(SUM(c.weight), 0) FROM Criteria c WHERE c.round.id = :roundId AND c.id != :excludeId")
    int sumWeightsByRoundIdExcluding(@Param("roundId") UUID roundId, @Param("excludeId") UUID excludeId);

    void deleteAllByRoundId(UUID roundId);

    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM judge_score_details WHERE criteria_id = :criteriaId", nativeQuery = true)
    int countScoresByCriteriaId(@Param("criteriaId") UUID criteriaId);

    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM judge_scores WHERE round_id = :roundId", nativeQuery = true)
    int countScoresByRoundId(@Param("roundId") UUID roundId);
}
