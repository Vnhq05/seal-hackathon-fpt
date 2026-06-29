package com.sealhackathon.feedback.event;

import java.util.UUID;

public record ParticipantFeedbackSubmittedEvent(
        UUID feedbackId,
        UUID eventId,
        UUID userId,
        UUID teamId,
        int overallRating) {}
