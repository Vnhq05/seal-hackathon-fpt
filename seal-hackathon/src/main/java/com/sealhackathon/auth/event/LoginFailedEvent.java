package com.sealhackathon.auth.event;

import java.time.LocalDateTime;

public record LoginFailedEvent(String email, String ipAddress, int attemptCount, LocalDateTime timestamp) {}
