package com.sealhackathon.auth.event;

import java.time.LocalDateTime;
import java.util.UUID;

public record PasswordResetEvent(UUID userId, LocalDateTime timestamp) {}
