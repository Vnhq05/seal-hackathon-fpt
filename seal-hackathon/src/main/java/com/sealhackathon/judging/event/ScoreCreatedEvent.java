package com.sealhackathon.judging.event;

import java.util.UUID;

public record ScoreCreatedEvent(UUID judgeScoreId, UUID judgeId, UUID submissionId, UUID roundId) {}
