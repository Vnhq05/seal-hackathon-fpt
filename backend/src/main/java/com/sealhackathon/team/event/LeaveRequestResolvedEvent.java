package com.sealhackathon.team.event;

import java.util.UUID;

public record LeaveRequestResolvedEvent(
        UUID leaveRequestId,
        UUID teamId,
        UUID eventId,
        UUID userId,
        UUID leaderId,
        String teamName,
        boolean approved) {}
