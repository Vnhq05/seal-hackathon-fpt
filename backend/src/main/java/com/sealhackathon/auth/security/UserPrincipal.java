package com.sealhackathon.auth.security;

import java.util.UUID;

public record UserPrincipal(UUID userId, String email) {}
