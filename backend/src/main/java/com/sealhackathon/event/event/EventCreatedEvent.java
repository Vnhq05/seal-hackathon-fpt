package com.sealhackathon.event.event;

import java.util.UUID;

public record EventCreatedEvent(UUID eventId, String name, String coordinatorId) {}
