package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.enums.AssignmentScope;
import com.sealhackathon.event.domain.enums.RoundType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JudgeAssignmentRepository extends JpaRepository<JudgeAssignment, UUID> {

    List<JudgeAssignment> findByRoundId(UUID roundId);

    List<JudgeAssignment> findByRoundIdAndActiveTrue(UUID roundId);

    List<JudgeAssignment> findByRoundIdAndTrackId(UUID roundId, UUID trackId);

    List<JudgeAssignment> findByRoundIdAndTrackIdAndActiveTrue(UUID roundId, UUID trackId);

    List<JudgeAssignment> findByRoundIdAndScopeAndActiveTrue(UUID roundId, AssignmentScope scope);

    List<JudgeAssignment> findByRoundIdAndJudgeUserIdAndActiveTrue(UUID roundId, UUID judgeUserId);

    List<JudgeAssignment> findByJudgeUserIdAndActiveTrue(UUID judgeUserId);

    List<JudgeAssignment> findByJudgeUserId(UUID judgeUserId);

    List<JudgeAssignment> findByGroupIdAndActiveTrue(UUID groupId);

    long countByJudgeUserId(UUID judgeUserId);

    /**
     * True if the judge was assigned to any other round of this event (any scope:
     * ROUND / TRACK / GROUP), including deactivated assignments.
     */
    @Query("""
            SELECT CASE WHEN COUNT(ja) > 0 THEN true ELSE false END
            FROM JudgeAssignment ja
            WHERE ja.judgeUserId = :judgeUserId
              AND ja.round.hackathonEvent.id = :eventId
              AND ja.round.id <> :excludeRoundId
            """)
    boolean existsPriorAssignmentInEvent(
            @Param("judgeUserId") UUID judgeUserId,
            @Param("eventId") UUID eventId,
            @Param("excludeRoundId") UUID excludeRoundId);

    /** Active assignment on any non-Final round of the event (used to keep Final panel fresh). */
    @Query("""
            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
            FROM JudgeAssignment a
            WHERE a.judgeUserId = :judgeUserId
              AND a.active = true
              AND a.round.hackathonEvent.id = :eventId
              AND a.round.roundType <> :finalType
            """)
    boolean existsActiveNonFinalAssignmentInEvent(
            @Param("judgeUserId") UUID judgeUserId,
            @Param("eventId") UUID eventId,
            @Param("finalType") RoundType finalType);
}
