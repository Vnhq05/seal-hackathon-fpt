package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.enums.AssignmentScope;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
