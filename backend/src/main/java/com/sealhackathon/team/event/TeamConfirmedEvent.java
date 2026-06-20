package com.sealhackathon.team.event;

import java.util.UUID;

public record TeamConfirmedEvent(UUID teamId, int memberCount) {}
