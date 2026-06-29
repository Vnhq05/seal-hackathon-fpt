package com.sealhackathon.user.service;

import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.StudentStanding;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.dto.snapshot.LockState;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserPublicServiceImpl implements UserPublicService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<UserSnapshot> findByEmail(String email) {
        return userRepository.findByEmail(email).map(this::toSnapshot);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserSnapshot> findById(UUID userId) {
        return userRepository.findById(userId).map(this::toSnapshot);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSnapshot> findAllByIds(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return userRepository.findAllById(ids).stream()
                .map(this::toSnapshot)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isActive(UUID userId) {
        return userRepository.findById(userId)
                .map(user -> user.getStatus() == AccountStatus.ACTIVE)
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public LockState getLockState(UUID userId) {
        User user = getUserEntity(userId);
        return LockState.builder()
                .failedAttempts(user.getFailedLoginAttempts())
                .lockedUntil(user.getLockedUntil())
                .build();
    }

    @Override
    @Transactional
    public void incrementFailedAttempts(UUID userId) {
        User user = getUserEntity(userId);
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void resetFailedAttempts(UUID userId) {
        User user = getUserEntity(userId);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void lockAccount(UUID userId, LocalDateTime until) {
        User user = getUserEntity(userId);
        user.setLockedUntil(until);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public UUID createParticipant(String email, String passwordHash, String fullName,
                                  String phone, String studentId, String universityName,
                                  UserType userType, Integer semester, boolean temporaryAccount,
                                  StudentStanding studentStanding) {
        StudentStanding standing = studentStanding != null ? studentStanding : StudentStanding.ENROLLED;
        User user = User.builder()
                .email(email)
                .passwordHash(passwordHash)
                .fullName(fullName)
                .phone(phone)
                .studentId(studentId)
                .universityName(universityName)
                .userType(userType)
                .status(AccountStatus.PENDING)
                .semester(semester)
                .studentStanding(standing)
                .temporaryAccount(temporaryAccount)
                .build();
        return userRepository.save(user).getId();
    }

    @Override
    @Transactional
    public void activateParticipant(UUID userId) {
        User user = getUserEntity(userId);
        if (user.getStatus() == AccountStatus.PENDING) {
            user.setStatus(AccountStatus.ACTIVE);
            userRepository.save(user);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserSnapshot> getUser(UUID userId) {
        return findById(userId);
    }

    @Override
    @Transactional
    public void updatePassword(UUID userId, String newPasswordHash) {
        User user = getUserEntity(userId);
        user.setPasswordHash(newPasswordHash);
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasRole(UUID userId, UserType role) {
        return userRepository.findById(userId)
                .map(user -> user.getUserType() == role)
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public long countActiveUsers() {
        return userRepository.countByStatus(AccountStatus.ACTIVE);
    }

    private User getUserEntity(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private UserSnapshot toSnapshot(User user) {
        return UserSnapshot.builder()
                .id(user.getId())
                .email(user.getEmail())
                .passwordHash(user.getPasswordHash())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .studentId(user.getStudentId())
                .universityName(user.getUniversityName())
                .userType(user.getUserType())
                .status(user.getStatus())
                .semester(user.getSemester())
                .studentStanding(user.getStudentStanding())
                .build();
    }
}
