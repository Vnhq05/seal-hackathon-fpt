package com.sealhackathon.judging.event;

import java.util.UUID;

public record ScoringCompletedEvent(UUID submissionId, int judgeCount) {}
