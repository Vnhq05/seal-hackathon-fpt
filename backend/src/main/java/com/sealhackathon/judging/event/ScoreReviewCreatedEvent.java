package com.sealhackathon.judging.event;

import java.math.BigDecimal;
import java.util.UUID;

public record ScoreReviewCreatedEvent(
        UUID reviewId,
        UUID eventId,
        UUID submissionId,
        UUID teamId,
        BigDecimal deviationValue) {}
