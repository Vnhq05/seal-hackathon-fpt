package com.sealhackathon.judging.repository;

import com.sealhackathon.judging.domain.JudgeScoreDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JudgeScoreDetailRepository extends JpaRepository<JudgeScoreDetail, UUID> {

    List<JudgeScoreDetail> findByJudgeScoreId(UUID judgeScoreId);

    boolean existsByCriteriaId(UUID criteriaId);
}
