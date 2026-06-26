package com.sealhackathon.team.event;

import java.util.UUID;

public record JoinRequestResolvedEvent(
        UUID joinRequestId,
        UUID teamId,
        UUID eventId,
        UUID requesterId,
        String teamName,
        boolean accepted) {}
