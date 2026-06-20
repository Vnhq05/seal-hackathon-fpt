package com.sealhackathon.ranking.event;

import java.util.UUID;

public record DisputeResolvedEvent(UUID disputeId, String resolution, UUID resolvedBy) {}
