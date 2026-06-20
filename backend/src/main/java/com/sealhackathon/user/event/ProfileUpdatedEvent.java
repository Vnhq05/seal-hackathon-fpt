package com.sealhackathon.user.event;

import java.util.List;
import java.util.UUID;

public record ProfileUpdatedEvent(UUID userId, List<String> changedFields) {}
