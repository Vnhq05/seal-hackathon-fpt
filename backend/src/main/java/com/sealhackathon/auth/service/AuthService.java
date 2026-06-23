package com.sealhackathon.auth.service;

import com.sealhackathon.auth.domain.PasswordResetToken;
import com.sealhackathon.auth.domain.RefreshToken;
import com.sealhackathon.auth.dto.request.ForgotPasswordRequest;
import com.sealhackathon.auth.dto.request.LoginRequest;
import com.sealhackathon.auth.dto.request.RegisterRequest;
import com.sealhackathon.auth.dto.request.ResetPasswordRequest;
import com.sealhackathon.auth.dto.response.AuthResponse;
import com.sealhackathon.auth.dto.response.UserInfoResponse;
import com.sealhackathon.auth.event.LoginFailedEvent;
import com.sealhackathon.auth.event.PasswordResetEvent;
import com.sealhackathon.auth.event.UserLoggedInEvent;
import com.sealhackathon.auth.security.JwtProvider;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.AccountLockedException;
import com.sealhackathon.common.exception.AccountNotActivatedException;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.InvalidCredentialsException;
import com.sealhackathon.user.dto.snapshot.LockState;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserPublicService userPublicService;
    private final TokenService tokenService;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;
    private static final Pattern FPT_STUDENT_ID_PATTERN = Pattern.compile("^SE[0-9]{6}$");

    private static final Set<UserType> PARTICIPANT_TYPES = Set.of(
            UserType.FPT_STUDENT,
            UserType.EXTERNAL_STUDENT
    );

    // ── BR-01: Participant self-registration ──
    @Transactional
    public UUID register(RegisterRequest request) {
        if (!PARTICIPANT_TYPES.contains(request.getUserType())) {
            throw new BusinessException("Only FPT_STUDENT and EXTERNAL_STUDENT can self-register", HttpStatus.BAD_REQUEST) {};
        }

        // BR-03: validate FPT student ID
        if (request.getUserType() == UserType.FPT_STUDENT) {
            if (request.getStudentId() == null || request.getStudentId().isBlank()) {
                throw new BusinessException("Student ID is required for FPT students", HttpStatus.BAD_REQUEST) {};
            }
            if (!FPT_STUDENT_ID_PATTERN.matcher(request.getStudentId()).matches()) {
                throw new BusinessException("Student ID must match format SE followed by 6 digits", HttpStatus.BAD_REQUEST) {};
            }
        }

        // BR-03: validate external student fields
        if (request.getUserType() == UserType.EXTERNAL_STUDENT) {
            if (request.getStudentId() == null) {
                throw new BusinessException("Student ID is required for external students", HttpStatus.BAD_REQUEST) {};
            }
            if (request.getUniversityName() == null || request.getUniversityName().isBlank()) {
                throw new BusinessException("University name is required for external students", HttpStatus.BAD_REQUEST) {};
            }
        }

        // BR-04: email unique
        if (userPublicService.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Account", "email", request.getEmail());
        }

        String passwordHash = passwordEncoder.encode(request.getPassword());

        return userPublicService.createParticipant(
                request.getEmail(),
                passwordHash,
                request.getFullName(),
                request.getPhone(),
                request.getStudentId(),
                request.getUniversityName(),
                request.getUserType(),
                request.getSemester()
        );
    }

    // ── BR-05: Login ──
    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        UserSnapshot user = userPublicService.findByEmail(request.getEmail())
                .orElseThrow(InvalidCredentialsException::new);

        // BR-05: only Active accounts can login
        if (user.getStatus() == AccountStatus.PENDING || user.getStatus() == AccountStatus.REJECTED) {
            throw new AccountNotActivatedException();
        }

        // BR-06: check lock state
        LockState lockState = userPublicService.getLockState(user.getId());
        if (lockState.isLocked()) {
            throw new AccountLockedException(lockState.getLockedUntil());
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user, ipAddress);
            throw new InvalidCredentialsException();
        }

        // Successful login — reset failed attempts
        userPublicService.resetFailedAttempts(user.getId());

        String accessToken = jwtProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getUserType().name());
        String refreshToken = tokenService.createRefreshToken(user.getId());

        eventPublisher.publishEvent(new UserLoggedInEvent(user.getId(), ipAddress, LocalDateTime.now()));

        return buildAuthResponse(accessToken, refreshToken, user);
    }

    // ── BR-05: Refresh token ──
    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr) {
        RefreshToken refreshToken = tokenService.validateRefreshToken(refreshTokenStr);

        UserSnapshot user = userPublicService.findById(refreshToken.getUserId())
                .orElseThrow(InvalidCredentialsException::new);

        // Revoke old, issue new
        tokenService.revokeRefreshToken(refreshTokenStr);
        String newAccessToken = jwtProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getUserType().name());
        String newRefreshToken = tokenService.createRefreshToken(user.getId());

        return buildAuthResponse(newAccessToken, newRefreshToken, user);
    }

    // ── Logout ──
    @Transactional
    public void logout(String refreshTokenStr) {
        tokenService.revokeRefreshToken(refreshTokenStr);
    }

    // ── BR-07: Forgot password ──
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        UserSnapshot user = userPublicService.findByEmail(request.getEmail())
                .orElse(null);

        // Always return success to prevent email enumeration
        if (user == null || user.getStatus() != AccountStatus.ACTIVE) {
            return null;
        }

        return tokenService.createPasswordResetToken(user.getId());
    }

    // ── BR-07: Reset password ──
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = tokenService.validatePasswordResetToken(request.getToken());

        String newPasswordHash = passwordEncoder.encode(request.getNewPassword());

        UUID userId = resetToken.getUserId();

        // Update password via the user module
        userPublicService.updatePassword(userId, newPasswordHash);

        UserSnapshot user = userPublicService.findById(userId)
                .orElseThrow(InvalidCredentialsException::new);

        // Mark token as used
        tokenService.markPasswordResetTokenUsed(resetToken);

        // BR-07: invalidate all sessions
        tokenService.revokeAllUserTokens(user.getId());

        // Reset failed attempts and unlock
        userPublicService.resetFailedAttempts(user.getId());

        eventPublisher.publishEvent(new PasswordResetEvent(user.getId(), LocalDateTime.now()));
    }

    // ── BR-06: Handle failed login ──
    private void handleFailedLogin(UserSnapshot user, String ipAddress) {
        userPublicService.incrementFailedAttempts(user.getId());
        LockState lockState = userPublicService.getLockState(user.getId());

        eventPublisher.publishEvent(new LoginFailedEvent(
                user.getEmail(), ipAddress, lockState.getFailedAttempts(), LocalDateTime.now()));

        if (lockState.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
            LocalDateTime lockUntil = LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES);
            userPublicService.lockAccount(user.getId(), lockUntil);
        }
    }

    private AuthResponse buildAuthResponse(String accessToken, String refreshToken, UserSnapshot user) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtProvider.getAccessTokenExpirationMs() / 1000)
                .tokenType("Bearer")
                .user(UserInfoResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .userType(user.getUserType())
                        .status(user.getStatus())
                        .build())
                .build();
    }
}
