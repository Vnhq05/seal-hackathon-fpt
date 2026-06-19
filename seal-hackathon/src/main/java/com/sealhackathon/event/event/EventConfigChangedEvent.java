package com.sealhackathon.event.event;

import java.util.UUID;

public record EventConfigChangedEvent(UUID eventId, String field, String oldValue, String newValue) {}
