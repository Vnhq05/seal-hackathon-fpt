package com.sealhackathon.team.event;

import java.util.UUID;

public record TeamCreatedEvent(UUID teamId, UUID eventId, UUID leaderId, String teamName) {}
