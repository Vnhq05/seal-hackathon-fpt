package com.sealhackathon.judging.repository;

import com.sealhackathon.judging.domain.TeamJudgeAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamJudgeAssignmentRepository extends JpaRepository<TeamJudgeAssignment, UUID> {

    List<TeamJudgeAssignment> findByTeamIdAndRoundId(UUID teamId, UUID roundId);

    long countByTeamIdAndRoundId(UUID teamId, UUID roundId);

    boolean existsByTeamIdAndRoundIdAndJudgeUserId(UUID teamId, UUID roundId, UUID judgeUserId);

    List<TeamJudgeAssignment> findByRoundId(UUID roundId);
}
