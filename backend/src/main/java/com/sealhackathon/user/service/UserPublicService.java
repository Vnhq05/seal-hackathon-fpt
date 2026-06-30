package com.sealhackathon.user.service;

import com.sealhackathon.common.enums.StudentStanding;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.user.dto.snapshot.LockState;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserPublicService {

    Optional<UserSnapshot> findByEmail(String email);

    Optional<UserSnapshot> findById(UUID userId);

    List<UserSnapshot> findAllByIds(List<UUID> ids);

    boolean existsByEmail(String email);

    boolean isActive(UUID userId);

    LockState getLockState(UUID userId);

    void incrementFailedAttempts(UUID userId);

    void resetFailedAttempts(UUID userId);

    void lockAccount(UUID userId, LocalDateTime until);

    UUID createParticipant(String email, String passwordHash, String fullName,
                           String phone, String studentId, String universityName,
                           UserType userType, Integer semester, boolean temporaryAccount,
                           StudentStanding studentStanding);

    void activateParticipant(UUID userId);

    void activateParticipantForEnrollment(UUID userId);

    Optional<UserSnapshot> getUser(UUID userId);

    void updatePassword(UUID userId, String newPasswordHash);

    void updateSemester(UUID userId, Integer semester);

    boolean hasRole(UUID userId, UserType role);

    long countActiveUsers();
}
