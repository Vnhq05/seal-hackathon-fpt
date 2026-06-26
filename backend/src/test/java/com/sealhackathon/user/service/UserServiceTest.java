package com.sealhackathon.user.service;

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
import com.sealhackathon.user.dto.request.UpdateProfileRequest;
import com.sealhackathon.user.dto.response.UserListResponse;
import com.sealhackathon.user.dto.response.UserProfileResponse;
import com.sealhackathon.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private UserService userService;

    // ═══════════════════════════════════════
    //  Profile
    // ═══════════════════════════════════════

    @Test
    void getProfile_shouldReturnProfile_whenUserExists() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, "test@fpt.edu.vn", AccountStatus.ACTIVE, UserType.FPT_STUDENT);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UserProfileResponse result = userService.getProfile(userId);

        assertThat(result.getId()).isEqualTo(userId);
        assertThat(result.getEmail()).isEqualTo("test@fpt.edu.vn");
        assertThat(result.getUserType()).isEqualTo(UserType.FPT_STUDENT);
    }

    @Test
    void getProfile_shouldThrow_whenUserNotFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getProfile(userId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateProfile_shouldUpdateFields_andPublishEvent() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, "test@fpt.edu.vn", AccountStatus.ACTIVE, UserType.FPT_STUDENT);
        user.setFullName("Old Name");
        user.setPhone("0901111111");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("New Name")
                .phone("0902222222")
                .build();

        UserProfileResponse result = userService.updateProfile(userId, request);

        assertThat(result.getFullName()).isEqualTo("New Name");
        assertThat(result.getPhone()).isEqualTo("0902222222");
        verify(userRepository).save(any(User.class));
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    void updateProfile_shouldNotSave_whenNothingChanged() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, "test@fpt.edu.vn", AccountStatus.ACTIVE, UserType.FPT_STUDENT);
        user.setFullName("Same Name");
        user.setPhone(null);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Same Name")
                .phone(null)
                .build();

        userService.updateProfile(userId, request);

        verify(userRepository, never()).save(any(User.class));
        verify(eventPublisher, never()).publishEvent(any(Object.class));
    }

    @Test
    void changePassword_shouldUpdate_whenCurrentPasswordCorrect() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, "test@fpt.edu.vn", AccountStatus.ACTIVE, UserType.FPT_STUDENT);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("current", "hashed_pw")).thenReturn(true);
        when(passwordEncoder.encode("newpass123")).thenReturn("new_hashed");

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("current")
                .newPassword("newpass123")
                .build();

        userService.changePassword(userId, request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("new_hashed");
    }

    @Test
    void changePassword_shouldThrow_whenCurrentPasswordWrong() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, "test@fpt.edu.vn", AccountStatus.ACTIVE, UserType.FPT_STUDENT);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed_pw")).thenReturn(false);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("wrong")
                .newPassword("newpass123")
                .build();

        assertThatThrownBy(() -> userService.changePassword(userId, request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    // ═══════════════════════════════════════
    //  Approval — BR-01
    // ═══════════════════════════════════════

    @Test
    void approveOrReject_shouldApprove_whenPending() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, "pending@test.com", AccountStatus.PENDING, UserType.FPT_STUDENT);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        ApprovalRequest request = ApprovalRequest.builder()
                .userId(userId)
                .action(ApprovalRequest.Action.APPROVE)
                .build();

        UserProfileResponse result = userService.approveOrReject(request);

        assertThat(result.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        verify(eventPublisher).publishEvent(any(com.sealhackathon.user.event.AccountApprovedEvent.class));
    }

    @Test
    void approveOrReject_shouldReject_whenPendingWithReason() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, "pending@test.com", AccountStatus.PENDING, UserType.EXTERNAL_STUDENT);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        ApprovalRequest request = ApprovalRequest.builder()
                .userId(userId)
                .action(ApprovalRequest.Action.REJECT)
                .reason("Invalid student ID")
                .build();

        UserProfileResponse result = userService.approveOrReject(request);

        assertThat(result.getStatus()).isEqualTo(AccountStatus.REJECTED);
        verify(eventPublisher).publishEvent(any(com.sealhackathon.user.event.AccountRejectedEvent.class));
    }

    @Test
    void approveOrReject_shouldThrow_whenRejectingWithoutReason() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, "pending@test.com", AccountStatus.PENDING, UserType.FPT_STUDENT);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        ApprovalRequest request = ApprovalRequest.builder()
                .userId(userId)
                .action(ApprovalRequest.Action.REJECT)
                .reason(null)
                .build();

        assertThatThrownBy(() -> userService.approveOrReject(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Reason is required");
    }

    @Test
    void approveOrReject_shouldThrow_whenAlreadyActive() {
        UUID userId = UUID.randomUUID();
        User user = buildUser(userId, "active@test.com", AccountStatus.ACTIVE, UserType.FPT_STUDENT);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        ApprovalRequest request = ApprovalRequest.builder()
                .userId(userId)
                .action(ApprovalRequest.Action.APPROVE)
                .build();

        assertThatThrownBy(() -> userService.approveOrReject(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only PENDING accounts");
    }

    // ═══════════════════════════════════════
    //  Internal Account Creation — BR-02
    // ═══════════════════════════════════════

    @Test
    void createInternalAccount_shouldCreate_whenValidInternalRole() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        CreateInternalAccountRequest request = CreateInternalAccountRequest.builder()
                .email("mentor@test.com")
                .password("password")
                .fullName("Mentor User")
                .phone("0901234567")
                .userType(UserType.LECTURER)
                .build();

        UserProfileResponse result = userService.createInternalAccount(request);

        assertThat(result.getEmail()).isEqualTo("mentor@test.com");
        assertThat(result.getUserType()).isEqualTo(UserType.LECTURER);
        assertThat(result.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        verify(eventPublisher).publishEvent(any(com.sealhackathon.user.event.InternalAccountCreatedEvent.class));
    }

    @Test
    void createInternalAccount_shouldThrow_whenParticipantRole() {
        CreateInternalAccountRequest request = CreateInternalAccountRequest.builder()
                .email("student@test.com")
                .password("password")
                .fullName("Student")
                .userType(UserType.FPT_STUDENT)
                .build();

        assertThatThrownBy(() -> userService.createInternalAccount(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only internal roles");
    }

    @Test
    void createInternalAccount_shouldThrow_whenEmailExists() {
        when(userRepository.existsByEmail("exists@test.com")).thenReturn(true);

        CreateInternalAccountRequest request = CreateInternalAccountRequest.builder()
                .email("exists@test.com")
                .password("password")
                .fullName("Duplicate")
                .userType(UserType.EVENT_COORDINATOR)
                .build();

        assertThatThrownBy(() -> userService.createInternalAccount(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void createInternalAccount_shouldAcceptAllInternalRoles() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        for (UserType role : List.of(UserType.LECTURER, UserType.EVENT_COORDINATOR, UserType.SYSTEM_ADMIN)) {
            CreateInternalAccountRequest request = CreateInternalAccountRequest.builder()
                    .email(role.name().toLowerCase() + "@test.com")
                    .password("password")
                    .fullName(role.name())
                    .userType(role)
                    .build();

            UserProfileResponse result = userService.createInternalAccount(request);
            assertThat(result.getUserType()).isEqualTo(role);
            assertThat(result.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        }
    }

    // ═══════════════════════════════════════
    //  Admin Listing
    // ═══════════════════════════════════════

    @Test
    void listUsers_shouldReturnPage() {
        User user = buildUser(UUID.randomUUID(), "a@b.com", AccountStatus.ACTIVE, UserType.FPT_STUDENT);
        Page<User> page = new PageImpl<>(List.of(user));
        when(userRepository.findByFilters(null, null, null, PageRequest.of(0, 20)))
                .thenReturn(page);

        Page<UserListResponse> result = userService.listUsers(null, null, null, PageRequest.of(0, 20));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getEmail()).isEqualTo("a@b.com");
    }

    @Test
    void getPendingAccounts_shouldReturnOnlyPending() {
        User pending = buildUser(UUID.randomUUID(), "p@b.com", AccountStatus.PENDING, UserType.EXTERNAL_STUDENT);
        Page<User> page = new PageImpl<>(List.of(pending));
        when(userRepository.findByStatus(AccountStatus.PENDING, PageRequest.of(0, 20)))
                .thenReturn(page);

        Page<UserListResponse> result = userService.getPendingAccounts(PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(AccountStatus.PENDING);
    }

    // ═══════════════════════════════════════
    //  Helper
    // ═══════════════════════════════════════

    private User buildUser(UUID id, String email, AccountStatus status, UserType userType) {
        User user = User.builder()
                .email(email)
                .passwordHash("hashed_pw")
                .fullName("Test User")
                .userType(userType)
                .status(status)
                .build();
        user.setId(id);
        return user;
    }
}
