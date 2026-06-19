package com.sealhackathon.event.event;

import java.util.UUID;

public record JudgeAssignedEvent(UUID assignmentId, UUID judgeId, UUID roundId, UUID eventId) {}
