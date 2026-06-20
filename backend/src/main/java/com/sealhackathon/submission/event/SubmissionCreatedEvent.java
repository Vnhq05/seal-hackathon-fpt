package com.sealhackathon.submission.event;

import java.util.UUID;

public record SubmissionCreatedEvent(UUID submissionId, UUID teamId, UUID roundId, int versionNumber) {}
