package com.sealhackathon.ranking.event;

import java.time.LocalDateTime;
import java.util.UUID;

public record ResultsPublishedEvent(UUID roundId, UUID publishedBy,
                                     LocalDateTime publishedAt, LocalDateTime disputeDeadline) {}
