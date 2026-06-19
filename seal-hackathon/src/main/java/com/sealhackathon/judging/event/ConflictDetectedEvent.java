package com.sealhackathon.judging.event;

import java.util.UUID;

public record ConflictDetectedEvent(UUID judgeId, UUID teamId, UUID submissionId) {}
