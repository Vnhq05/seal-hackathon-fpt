package com.sealhackathon.team.event;

import java.util.UUID;

public record MemberKickedEvent(UUID teamId, UUID userId, String teamName) {}
