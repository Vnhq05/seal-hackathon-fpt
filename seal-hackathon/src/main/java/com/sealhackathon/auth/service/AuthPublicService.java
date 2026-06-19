package com.sealhackathon.auth.service;

import com.sealhackathon.common.enums.UserType;

import java.util.UUID;

public interface AuthPublicService {

    UUID getCurrentUserId();

    UserType getCurrentUserRole();

    void invalidateAllSessions(UUID userId);
}
