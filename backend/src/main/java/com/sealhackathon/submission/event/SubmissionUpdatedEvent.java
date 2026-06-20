package com.sealhackathon.submission.event;

import java.util.UUID;

public record SubmissionUpdatedEvent(UUID submissionId, UUID teamId, int newVersionNumber) {}
