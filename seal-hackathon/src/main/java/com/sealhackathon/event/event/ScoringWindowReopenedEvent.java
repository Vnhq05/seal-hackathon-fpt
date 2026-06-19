package com.sealhackathon.event.event;

import java.time.LocalDateTime;
import java.util.UUID;

public record ScoringWindowReopenedEvent(UUID roundId, LocalDateTime newDeadline) {}
