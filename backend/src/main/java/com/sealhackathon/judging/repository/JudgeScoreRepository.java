package com.sealhackathon.judging.repository;

import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JudgeScoreRepository extends JpaRepository<JudgeScore, UUID> {

    Optional<JudgeScore> findByJudgeUserIdAndSubmissionId(UUID judgeUserId, UUID submissionId);

    List<JudgeScore> findBySubmissionId(UUID submissionId);

    List<JudgeScore> findByRoundId(UUID roundId);

    List<JudgeScore> findByJudgeUserId(UUID judgeUserId);

    long countByJudgeUserId(UUID judgeUserId);

    int countBySubmissionId(UUID submissionId);

    int countBySubmissionIdAndStatus(UUID submissionId, ScoreStatus status);

    boolean existsByRoundId(UUID roundId);

    long countByRoundIdAndJudgeUserId(UUID roundId, UUID judgeUserId);

    @Query("SELECT CASE WHEN COUNT(js) > 0 THEN true ELSE false END FROM JudgeScore js, "
            + "com.sealhackathon.submission.domain.Submission s "
            + "WHERE js.submissionId = s.id AND js.judgeUserId = :judgeUserId "
            + "AND js.roundId = :roundId AND s.teamId = :teamId")
    boolean existsByJudgeUserIdAndRoundIdAndTeamId(
            @Param("judgeUserId") UUID judgeUserId,
            @Param("roundId") UUID roundId,
            @Param("teamId") UUID teamId);

    boolean existsByRoundIdAndStatus(UUID roundId, ScoreStatus status);

    @Query("SELECT js.submissionId, COUNT(js) FROM JudgeScore js "
            + "WHERE js.roundId = :roundId AND js.status IN :statuses GROUP BY js.submissionId")
    List<Object[]> countByRoundIdGroupBySubmission(
            @Param("roundId") UUID roundId,
            @Param("statuses") List<ScoreStatus> statuses);

    @Modifying
    @Query("UPDATE JudgeScore js SET js.status = :newStatus WHERE js.roundId = :roundId AND js.status = :currentStatus")
    int updateStatusByRoundId(@Param("roundId") UUID roundId,
                              @Param("currentStatus") ScoreStatus currentStatus,
                              @Param("newStatus") ScoreStatus newStatus);
}
