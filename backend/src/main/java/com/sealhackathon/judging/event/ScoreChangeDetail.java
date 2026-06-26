package com.sealhackathon.judging.event;

import java.util.UUID;

public record ScoreChangeDetail(UUID criteriaId, Integer oldScore, Integer newScore) {}
