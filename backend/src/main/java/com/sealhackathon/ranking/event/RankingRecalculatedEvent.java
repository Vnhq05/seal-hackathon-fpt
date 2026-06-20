package com.sealhackathon.ranking.event;

import java.util.UUID;

public record RankingRecalculatedEvent(UUID roundId, int version, int teamCount) {}
