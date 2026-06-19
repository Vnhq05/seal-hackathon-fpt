package com.sealhackathon.judging.repository;

import com.sealhackathon.judging.domain.JudgeComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JudgeCommentRepository extends JpaRepository<JudgeComment, UUID> {

    List<JudgeComment> findByJudgeScoreId(UUID judgeScoreId);
}
