package com.sealhackathon.team.event;

import java.util.List;
import java.util.UUID;

public record LeaveRequestCreatedEvent(
        UUID leaveRequestId,
        UUID teamId,
        UUID eventId,
        UUID userId,
        String teamName,
        String userFullName,
        List<UUID> coordinatorIds) {}
