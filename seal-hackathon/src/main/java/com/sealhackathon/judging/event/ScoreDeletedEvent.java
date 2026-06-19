package com.sealhackathon.judging.event;

import java.util.UUID;

public record ScoreDeletedEvent(UUID judgeScoreId, UUID judgeId, UUID submissionId, UUID roundId) {}
