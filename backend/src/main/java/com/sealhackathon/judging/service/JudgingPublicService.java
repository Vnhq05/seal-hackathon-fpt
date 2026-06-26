package com.sealhackathon.judging.service;

import com.sealhackathon.judging.dto.snapshot.JudgeScoreSnapshot;
import com.sealhackathon.judging.dto.snapshot.ScoreDetailSnapshot;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface JudgingPublicService {

    List<JudgeScoreSnapshot> getScoresBySubmission(UUID submissionId);

    List<JudgeScoreSnapshot> getScoresByRound(UUID roundId);

    int getScoreCountBySubmission(UUID submissionId);

    List<ScoreDetailSnapshot> getDetailedScores(UUID submissionId);

    boolean isFullyScored(UUID submissionId, int minJudges);

    int countCompletedScores(UUID submissionId);

    long countAssignedJudges(UUID teamId, UUID roundId);

    boolean existsLockedScoreByRound(UUID roundId);

    Map<UUID, Integer> countCompletedScoresByRound(UUID roundId);

    Map<UUID, Long> countAssignedJudgesByRound(UUID roundId);
}
