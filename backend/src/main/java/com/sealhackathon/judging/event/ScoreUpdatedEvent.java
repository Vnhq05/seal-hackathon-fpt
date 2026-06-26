package com.sealhackathon.judging.event;

import java.util.List;
import java.util.UUID;

public record ScoreUpdatedEvent(UUID judgeScoreId, UUID judgeId, UUID submissionId, UUID roundId,
                                UUID teamId, java.util.List<ScoreChangeDetail> changes) {}
