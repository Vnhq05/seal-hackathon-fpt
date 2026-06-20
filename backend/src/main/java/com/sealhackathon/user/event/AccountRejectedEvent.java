package com.sealhackathon.user.event;

import java.util.UUID;

public record AccountRejectedEvent(UUID userId, String email, String reason) {}
