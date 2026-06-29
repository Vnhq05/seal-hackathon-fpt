package com.sealhackathon.user.service;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.InvalidCredentialsException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.dto.request.ApprovalRequest;
import com.sealhackathon.user.dto.request.ChangePasswordRequest;
import com.sealhackathon.user.dto.request.CreateInternalAccountRequest;
import com.sealhackathon.user.dto.request.SetOfficialPasswordRequest;
import com.sealhackathon.user.dto.request.UpdateProfileRequest;
import com.sealhackathon.user.dto.response.UserListResponse;
import com.sealhackathon.user.dto.response.UserProfileResponse;
import com.sealhackathon.user.dto.response.UserSearchResponse;
import com.sealhackathon.user.event.AccountApprovedEvent;
import com.sealhackathon.user.event.AccountRejectedEvent;
import com.sealhackathon.user.event.InternalAccountCreatedEvent;
import com.sealhackathon.user.event.ProfileUpdatedEvent;
import com.sealhackathon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final UserReferenceService userReferenceService;
    private final AuthPublicService authPublicService;

    private static final Set<String> PROTECTED_EMAILS = Set.of(
            "admin@seal.com",
            "coordinator@seal.com",
            "lecturer1@fpt.edu.vn",
            "lecturer2@fpt.edu.vn",
            "lecturer3@fpt.edu.vn",
            "lecturer4@fpt.edu.vn",
            "lecturer5@fpt.edu.vn"
    );

    private static final Set<UserType> INTERNAL_ROLES = Set.of(
            UserType.LECTURER,
            UserType.EVENT_COORDINATOR,
            UserType.SYSTEM_ADMIN
    );

    // ═══════════════════════════════════════
    //  Profile Management
    // ═══════════════════════════════════════

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        User user = getUser(userId);
        return toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = getUser(userId);
        List<String> changed = new ArrayList<>();

        if (!user.getFullName().equals(request.getFullName())) {
            user.setFullName(request.getFullName());
            changed.add("fullName");
        }

        String newPhone = request.getPhone();
        String oldPhone = user.getPhone();
        if (newPhone != null ? !newPhone.equals(oldPhone) : oldPhone != null) {
            user.setPhone(newPhone);
            changed.add("phone");
        }

        if (!changed.isEmpty()) {
            userRepository.save(user);
            eventPublisher.publishEvent(new ProfileUpdatedEvent(userId, changed));
        }

        return toProfileResponse(user);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = getUser(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserProfileResponse setOfficialPassword(UUID userId, SetOfficialPasswordRequest request) {
        User user = getUser(userId);
        if (user.getUserType() != UserType.EXTERNAL_STUDENT || !user.isTemporaryAccount()) {
            throw new BusinessException(
                    "Official password setup is only available for temporary external student accounts",
                    HttpStatus.BAD_REQUEST) {};
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setTemporaryAccount(false);
        userRepository.save(user);
        return toProfileResponse(user);
    }

    // ═══════════════════════════════════════
    //  Account Approval — BR-01
    // ═══════════════════════════════════════

    @Transactional
    public UserProfileResponse approveOrReject(ApprovalRequest request) {
        User user = getUser(request.getUserId());

        if (user.getStatus() != AccountStatus.PENDING) {
            throw new BusinessException(
                    String.format("Cannot %s account with status %s. Only PENDING accounts can be processed.",
                            request.getAction(), user.getStatus()),
                    HttpStatus.BAD_REQUEST) {};
        }

        if (request.getAction() == ApprovalRequest.Action.APPROVE) {
            user.setStatus(AccountStatus.ACTIVE);
            userRepository.save(user);
            eventPublisher.publishEvent(
                    new AccountApprovedEvent(user.getId(), user.getEmail(), user.getFullName()));
        } else {
            if (request.getReason() == null || request.getReason().isBlank()) {
                throw new BusinessException("Reason is required when rejecting an account",
                        HttpStatus.BAD_REQUEST) {};
            }
            user.setStatus(AccountStatus.REJECTED);
            userRepository.save(user);
            eventPublisher.publishEvent(
                    new AccountRejectedEvent(user.getId(), user.getEmail(), request.getReason()));
        }

        return toProfileResponse(user);
    }

    @Transactional(readOnly = true)
    public Page<UserListResponse> getPendingAccounts(Pageable pageable) {
        return userRepository.findByStatus(AccountStatus.PENDING, pageable)
                .map(this::toListResponse);
    }

    // ═══════════════════════════════════════
    //  Internal Account Creation — BR-02
    // ═══════════════════════════════════════

    @Transactional
    public UserProfileResponse createInternalAccount(CreateInternalAccountRequest request) {
        if (!INTERNAL_ROLES.contains(request.getUserType())) {
            throw new BusinessException(
                    "Only internal roles (LECTURER, EVENT_COORDINATOR, SYSTEM_ADMIN) can be created by admin. " +
                            "Received: " + request.getUserType(),
                    HttpStatus.BAD_REQUEST) {};
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Account", "email", request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .userType(request.getUserType())
                .status(AccountStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        eventPublisher.publishEvent(
                new InternalAccountCreatedEvent(user.getId(), user.getEmail(), user.getUserType()));

        return toProfileResponse(user);
    }

    // ═══════════════════════════════════════
    //  Admin Listing
    // ═══════════════════════════════════════

    @Transactional(readOnly = true)
    public Page<UserListResponse> listUsers(AccountStatus status, UserType userType,
                                            String search, Pageable pageable) {
        return userRepository.findByFilters(status, userType, search, pageable)
                .map(this::toListResponse);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserById(UUID userId) {
        return toProfileResponse(getUser(userId));
    }

    @Transactional(readOnly = true)
    public long countPendingAccounts() {
        return userRepository.countByStatus(AccountStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public Page<UserListResponse> listStudentParticipants(AccountStatus status, String search,
                                                          Pageable pageable) {
        return userRepository.findStudentParticipants(status, search, pageable)
                .map(this::toListResponse);
    }

    @Transactional(readOnly = true)
    public List<UserSearchResponse> searchActiveStudents(String query, int limit) {
        if (query == null || query.trim().length() < 2) {
            throw new BusinessException("Search query must be at least 2 characters",
                    HttpStatus.BAD_REQUEST) {};
        }
        return userRepository.searchActiveStudents(query.trim(), PageRequest.of(0, limit)).stream()
                .map(user -> UserSearchResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .build())
                .toList();
    }

    // ═══════════════════════════════════════
    //  Admin Deactivate / Delete
    // ═══════════════════════════════════════

    @Transactional
    public UserProfileResponse deactivateUser(UUID userId, UUID currentUserId) {
        User user = getUser(userId);
        guardAccountManagement(user, currentUserId);

        if (user.getStatus() == AccountStatus.LOCKED) {
            return toProfileResponse(user);
        }

        user.setStatus(AccountStatus.LOCKED);
        user = userRepository.save(user);
        authPublicService.invalidateAllSessions(userId);

        return toProfileResponse(user);
    }

    @Transactional
    public void deleteUser(UUID userId, UUID currentUserId) {
        User user = getUser(userId);
        guardAccountManagement(user, currentUserId);

        if (userReferenceService.hasReferences(userId)) {
            String details = userReferenceService.describeReferences(userId).stream()
                    .collect(Collectors.joining("; "));
            throw new BusinessException(
                    "Cannot delete user: account is referenced in the system (" + details
                            + "). Deactivate the account instead.",
                    HttpStatus.CONFLICT) {};
        }

        authPublicService.invalidateAllSessions(userId);
        userRepository.delete(user);
    }

    // ═══════════════════════════════════════
    //  Helpers
    // ═══════════════════════════════════════

    private void guardAccountManagement(User user, UUID currentUserId) {
        if (PROTECTED_EMAILS.contains(user.getEmail().toLowerCase())) {
            throw new BusinessException(
                    "This account is protected and cannot be modified",
                    HttpStatus.FORBIDDEN) {};
        }
        if (user.getId().equals(currentUserId)) {
            throw new BusinessException(
                    "You cannot deactivate or delete your own account",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .studentId(user.getStudentId())
                .universityName(user.getUniversityName())
                .userType(user.getUserType())
                .status(user.getStatus())
                .studentStanding(user.getStudentStanding())
                .semester(user.getSemester())
                .temporaryAccount(user.isTemporaryAccount())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UserListResponse toListResponse(User user) {
        return UserListResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .studentId(user.getStudentId())
                .universityName(user.getUniversityName())
                .userType(user.getUserType())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
