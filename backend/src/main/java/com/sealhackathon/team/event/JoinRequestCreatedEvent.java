package com.sealhackathon.team.event;

import java.util.UUID;

public record JoinRequestCreatedEvent(
        UUID joinRequestId,
        UUID teamId,
        UUID eventId,
        UUID requesterId,
        String teamName,
        UUID leaderId) {}
