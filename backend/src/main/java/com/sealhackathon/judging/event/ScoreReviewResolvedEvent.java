package com.sealhackathon.judging.event;

import java.util.UUID;

public record ScoreReviewResolvedEvent(
        UUID reviewId,
        UUID eventId,
        UUID resolvedBy,
        String status,
        String resolutionNote) {}
