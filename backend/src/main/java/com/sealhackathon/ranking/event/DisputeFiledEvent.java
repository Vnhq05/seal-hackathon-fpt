package com.sealhackathon.ranking.event;

import java.util.UUID;

public record DisputeFiledEvent(UUID disputeId, UUID teamId, UUID roundId, UUID filedBy) {}
