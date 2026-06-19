package com.sealhackathon.auth.event;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserLoggedInEvent(UUID userId, String ipAddress, LocalDateTime timestamp) {}
