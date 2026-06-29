package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.JudgeAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JudgeAssignmentRepository extends JpaRepository<JudgeAssignment, UUID> {

    List<JudgeAssignment> findByRoundId(UUID roundId);

    List<JudgeAssignment> findByRoundIdAndTrackId(UUID roundId, UUID trackId);

    List<JudgeAssignment> findByRoundIdAndTrackIdIsNull(UUID roundId);

    boolean existsByRoundIdAndJudgeUserIdAndTrackId(UUID roundId, UUID judgeUserId, UUID trackId);

    boolean existsByRoundIdAndJudgeUserIdAndTrackIdIsNull(UUID roundId, UUID judgeUserId);

    List<JudgeAssignment> findByJudgeUserId(UUID judgeUserId);

    long countByJudgeUserId(UUID judgeUserId);
}
