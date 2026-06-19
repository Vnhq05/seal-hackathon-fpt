package com.sealhackathon.user.event;

import java.util.UUID;

public record AccountApprovedEvent(UUID userId, String email, String fullName) {}
