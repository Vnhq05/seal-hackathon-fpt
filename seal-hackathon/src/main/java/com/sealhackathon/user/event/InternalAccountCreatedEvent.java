package com.sealhackathon.user.event;

import com.sealhackathon.common.enums.UserType;

import java.util.UUID;

public record InternalAccountCreatedEvent(UUID userId, String email, UserType role) {}
