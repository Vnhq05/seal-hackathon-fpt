package com.sealhackathon.team.event;

import java.util.UUID;

public record MemberLeftEvent(UUID teamId, UUID userId) {}
