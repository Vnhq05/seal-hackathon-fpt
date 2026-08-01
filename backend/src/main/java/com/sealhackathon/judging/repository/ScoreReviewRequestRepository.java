package com.sealhackathon.judging.repository;

import com.sealhackathon.judging.domain.ScoreReviewRequest;
import com.sealhackathon.judging.domain.enums.ScoreReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScoreReviewRequestRepository extends JpaRepository<ScoreReviewRequest, UUID> {

    Optional<ScoreReviewRequest> findBySubmissionId(UUID submissionId);

    boolean existsBySubmissionIdAndStatus(UUID submissionId, ScoreReviewStatus status);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM ScoreReviewRequest r "
            + "WHERE r.submissionId = :submissionId AND r.status IN :statuses")
    boolean existsBySubmissionIdAndStatusIn(
            @Param("submissionId") UUID submissionId,
            @Param("statuses") List<ScoreReviewStatus> statuses);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM ScoreReviewRequest r "
            + "WHERE r.eventId = :eventId AND r.status IN :statuses")
    boolean existsByEventIdAndStatusIn(
            @Param("eventId") UUID eventId,
            @Param("statuses") List<ScoreReviewStatus> statuses);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM ScoreReviewRequest r "
            + "WHERE r.roundId = :roundId AND r.status IN :statuses")
    boolean existsByRoundIdAndStatusIn(
            @Param("roundId") UUID roundId,
            @Param("statuses") List<ScoreReviewStatus> statuses);

    @Query("SELECT r FROM ScoreReviewRequest r WHERE r.eventId = :eventId "
            + "AND (:roundId IS NULL OR r.roundId = :roundId) "
            + "AND (:status IS NULL OR r.status = :status) "
            + "ORDER BY r.createdAt DESC")
    List<ScoreReviewRequest> findByEventFilters(
            @Param("eventId") UUID eventId,
            @Param("roundId") UUID roundId,
            @Param("status") ScoreReviewStatus status);
}
