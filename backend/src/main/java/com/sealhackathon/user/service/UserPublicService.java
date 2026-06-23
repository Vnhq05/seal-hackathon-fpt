package com.sealhackathon.user.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.user.dto.snapshot.LockState;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface UserPublicService {

    Optional<UserSnapshot> findByEmail(String email);

    Optional<UserSnapshot> findById(UUID userId);

    boolean existsByEmail(String email);

    boolean isActive(UUID userId);

    LockState getLockState(UUID userId);

    void incrementFailedAttempts(UUID userId);

    void resetFailedAttempts(UUID userId);

    void lockAccount(UUID userId, LocalDateTime until);

    UUID createParticipant(String email, String passwordHash, String fullName,
                           String phone, String studentId, String universityName,
                           UserType userType, Integer semester);

    Optional<UserSnapshot> getUser(UUID userId);

    void updatePassword(UUID userId, String newPasswordHash);

    boolean hasRole(UUID userId, UserType role);

    long countActiveUsers();
}
