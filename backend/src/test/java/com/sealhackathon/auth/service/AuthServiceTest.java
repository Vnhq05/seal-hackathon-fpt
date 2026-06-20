package com.sealhackathon.auth.service;

import com.sealhackathon.auth.dto.request.LoginRequest;
import com.sealhackathon.auth.dto.request.RegisterRequest;
import com.sealhackathon.auth.dto.response.AuthResponse;
import com.sealhackathon.auth.security.JwtProvider;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.AccountNotActivatedException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.InvalidCredentialsException;
import com.sealhackathon.user.dto.snapshot.LockState;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserPublicService userPublicService;
    @Mock private TokenService tokenService;
    @Mock private JwtProvider jwtProvider;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private AuthService authService;

    // ── BR-01: Registration ──

    @Test
    void register_shouldCreateParticipant_whenValidFptStudent() {
        RegisterRequest request = RegisterRequest.builder()
                .email("student@fpt.edu.vn")
                .password("password123")
                .fullName("Nguyen Van A")
                .studentId("SE123456")
                .userType(UserType.FPT_STUDENT)
                .build();

        UUID expectedId = UUID.randomUUID();
        when(userPublicService.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userPublicService.createParticipant(
                anyString(), anyString(), anyString(), any(), anyString(), any(), eq(UserType.FPT_STUDENT)))
                .thenReturn(expectedId);

        UUID result = authService.register(request);

        assertThat(result).isEqualTo(expectedId);
    }

    @Test
    void register_shouldThrow_whenInternalRoleAttemptsSelfRegister() {
        RegisterRequest request = RegisterRequest.builder()
                .email("mentor@test.com")
                .password("password123")
                .fullName("Mentor")
                .userType(UserType.MENTOR)
                .build();

        assertThatThrownBy(() -> authService.register(request))
                .hasMessageContaining("Only FPT_STUDENT and EXTERNAL_STUDENT");
    }

    // ── BR-04: Duplicate email ──

    @Test
    void register_shouldThrowDuplicate_whenEmailExists() {
        RegisterRequest request = RegisterRequest.builder()
                .email("exists@test.com")
                .password("password123")
                .fullName("Test")
                .studentId("SE123456")
                .userType(UserType.FPT_STUDENT)
                .build();

        when(userPublicService.existsByEmail("exists@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    // ── BR-05: Login ──

    @Test
    void login_shouldReturnAuthResponse_whenCredentialsValid() {
        UUID userId = UUID.randomUUID();
        UserSnapshot user = UserSnapshot.builder()
                .id(userId)
                .email("active@test.com")
                .passwordHash("hashed")
                .fullName("Active User")
                .userType(UserType.FPT_STUDENT)
                .status(AccountStatus.ACTIVE)
                .build();
        LockState lockState = LockState.builder().failedAttempts(0).build();

        when(userPublicService.findByEmail("active@test.com")).thenReturn(Optional.of(user));
        when(userPublicService.getLockState(userId)).thenReturn(lockState);
        when(passwordEncoder.matches("password", "hashed")).thenReturn(true);
        when(jwtProvider.generateAccessToken(userId, "active@test.com", "FPT_STUDENT"))
                .thenReturn("access-token");
        when(jwtProvider.getAccessTokenExpirationMs()).thenReturn(900_000L);
        when(tokenService.createRefreshToken(userId)).thenReturn("refresh-token");

        AuthResponse response = authService.login(
                LoginRequest.builder().email("active@test.com").password("password").build(),
                "127.0.0.1");

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getUser().getId()).isEqualTo(userId);
        verify(userPublicService).resetFailedAttempts(userId);
    }

    @Test
    void login_shouldThrow_whenAccountPending() {
        UserSnapshot user = UserSnapshot.builder()
                .id(UUID.randomUUID())
                .email("pending@test.com")
                .status(AccountStatus.PENDING)
                .build();

        when(userPublicService.findByEmail("pending@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(
                LoginRequest.builder().email("pending@test.com").password("pass").build(), "127.0.0.1"))
                .isInstanceOf(AccountNotActivatedException.class);
    }

    @Test
    void login_shouldThrow_whenPasswordWrong() {
        UUID userId = UUID.randomUUID();
        UserSnapshot user = UserSnapshot.builder()
                .id(userId)
                .email("wrong@test.com")
                .passwordHash("hashed")
                .status(AccountStatus.ACTIVE)
                .build();
        LockState lockState = LockState.builder().failedAttempts(0).build();
        LockState afterIncrement = LockState.builder().failedAttempts(1).build();

        when(userPublicService.findByEmail("wrong@test.com")).thenReturn(Optional.of(user));
        when(userPublicService.getLockState(userId)).thenReturn(lockState).thenReturn(afterIncrement);
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(
                LoginRequest.builder().email("wrong@test.com").password("wrong").build(), "127.0.0.1"))
                .isInstanceOf(InvalidCredentialsException.class);

        verify(userPublicService).incrementFailedAttempts(userId);
    }

    // ── BR-03: External student requires universityName ──

    @Test
    void register_shouldThrow_whenExternalStudentMissingUniversity() {
        RegisterRequest request = RegisterRequest.builder()
                .email("ext@test.com")
                .password("password123")
                .fullName("External")
                .studentId("EXT001")
                .userType(UserType.EXTERNAL_STUDENT)
                .build();

        assertThatThrownBy(() -> authService.register(request))
                .hasMessageContaining("University name is required");
    }
}
