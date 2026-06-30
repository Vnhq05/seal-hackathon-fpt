package com.sealhackathon.auth.service;

import com.sealhackathon.auth.domain.EventMagicToken;
import com.sealhackathon.auth.domain.PasswordResetToken;
import com.sealhackathon.auth.domain.RefreshToken;
import com.sealhackathon.auth.repository.EmailOtpTokenRepository;
import com.sealhackathon.auth.dto.request.ForgotPasswordRequest;
import com.sealhackathon.auth.dto.request.LoginRequest;
import com.sealhackathon.auth.dto.request.RegisterRequest;
import com.sealhackathon.auth.dto.request.ResetPasswordRequest;
import com.sealhackathon.auth.dto.request.VerifyOtpRequest;
import com.sealhackathon.auth.dto.response.AuthResponse;
import com.sealhackathon.auth.dto.response.UserInfoResponse;
import com.sealhackathon.auth.event.LoginFailedEvent;
import com.sealhackathon.auth.event.PasswordResetEvent;
import com.sealhackathon.auth.event.UserLoggedInEvent;
import com.sealhackathon.auth.security.JwtProvider;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.StudentStanding;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.AccountLockedException;
import com.sealhackathon.common.exception.AccountNotActivatedException;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.InvalidCredentialsException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.service.AllowedEmailDomainService;
import com.sealhackathon.user.dto.snapshot.LockState;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
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
@Slf4j
public class AuthService {

    private final UserPublicService userPublicService;
    private final TokenService tokenService;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final AuthEmailService authEmailService;
    private final AllowedEmailDomainService allowedEmailDomainService;
    private final MagicLinkTokenService magicLinkTokenService;
    private final EmailOtpService emailOtpService;
    private final EmailOtpTokenRepository emailOtpTokenRepository;

    @Value("${app.hackathon.auth.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${app.hackathon.auth.lock-duration-minutes:15}")
    private int lockDurationMinutes;

    @Value("${app.hackathon.auth.fpt-student-id-pattern:^SE[0-9]{6}$}")
    private String fptStudentIdPatternStr;

    private Pattern fptStudentIdPattern;

    @PostConstruct
    private void initPatterns() {
        fptStudentIdPattern = Pattern.compile(fptStudentIdPatternStr);
    }

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

        // BR-03: validate FPT student ID and email
        if (request.getUserType() == UserType.FPT_STUDENT) {
            if (request.getStudentId() == null || request.getStudentId().isBlank()) {
                throw new BusinessException("Student ID is required for FPT students", HttpStatus.BAD_REQUEST) {};
            }
            if (!fptStudentIdPattern.matcher(request.getStudentId().trim().toUpperCase()).matches()) {
                throw new BusinessException("Student ID must match format SE followed by 6 digits", HttpStatus.BAD_REQUEST) {};
            }
        }

        // BR-03: validate external student fields
        if (request.getUserType() == UserType.EXTERNAL_STUDENT) {
            if (request.getStudentId() == null || request.getStudentId().isBlank()) {
                throw new BusinessException("Student ID is required for external students", HttpStatus.BAD_REQUEST) {};
            }
            allowedEmailDomainService.validateExternalRegistration(
                    request.getEmail().trim(),
                    request.getUniversityName());
        }

        if (request.getStudentStanding() == StudentStanding.GRADUATED) {
            throw new BusinessException(
                    "Graduated students are not eligible to participate",
                    HttpStatus.BAD_REQUEST) {};
        }

        // BR-04: email unique — resend OTP for unverified PENDING accounts
        String email = request.getEmail().trim();
        if (userPublicService.existsByEmail(email)) {
            UserSnapshot existing = userPublicService.findByEmail(email)
                    .orElseThrow(() -> new DuplicateResourceException("Account", "email", email));
            if (existing.getStatus() == AccountStatus.PENDING
                    && !emailOtpTokenRepository.existsByUserIdAndUsedTrue(existing.getId())) {
                String code = emailOtpService.resend(existing.getId());
                authEmailService.sendOtpEmail(existing.getEmail(), existing.getFullName(), code);
                return existing.getId();
            }
            throw new DuplicateResourceException("Account", "email", email);
        }

        String passwordHash = passwordEncoder.encode(request.getPassword());

        try {
            UUID userId = userPublicService.createParticipant(
                    email,
                    passwordHash,
                    request.getFullName(),
                    request.getPhone(),
                    request.getUserType() == UserType.FPT_STUDENT
                            ? request.getStudentId().trim().toUpperCase()
                            : request.getStudentId().trim(),
                    request.getUniversityName(),
                    request.getUserType(),
                    request.getSemester(),
                    false,
                    request.getStudentStanding()
            );
            String code = emailOtpService.create(userId);
            authEmailService.sendOtpEmail(email, request.getFullName(), code);
            return userId;
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateResourceException("Account", "email", email);
        }
    }

    @Transactional
    public String verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim();
        UserSnapshot user = userPublicService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (user.getStatus() != AccountStatus.PENDING) {
            throw new BusinessException(
                    "Account is not pending verification.", HttpStatus.BAD_REQUEST) {};
        }

        if (emailOtpTokenRepository.existsByUserIdAndUsedTrue(user.getId())) {
            throw new BusinessException("Email already verified.", HttpStatus.BAD_REQUEST) {};
        }

        var token = emailOtpService.validate(user.getId(), request.getOtp());
        emailOtpService.markUsed(token);

        if (user.getUserType() == UserType.FPT_STUDENT) {
            userPublicService.activateParticipant(user.getId());
            return "Email verified. Your account is now active. You can sign in.";
        }

        return "Email verified. Your account is pending admin approval.";
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
    public void forgotPassword(ForgotPasswordRequest request) {
        UserSnapshot user = userPublicService.findByEmail(request.getEmail())
                .orElse(null);

        if (user != null && user.getStatus() == AccountStatus.ACTIVE) {
            String token = tokenService.createPasswordResetToken(user.getId());
            authEmailService.sendPasswordResetEmail(user.getEmail(), token);
        }
    }

    // ── BR-07: Reset password ──
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = tokenService.validatePasswordResetToken(request.getToken());
        tokenService.markPasswordResetTokenUsed(resetToken);

        String newPasswordHash = passwordEncoder.encode(request.getNewPassword());

        UUID userId = resetToken.getUserId();

        // Update password via the user module
        userPublicService.updatePassword(userId, newPasswordHash);

        UserSnapshot user = userPublicService.findById(userId)
                .orElseThrow(InvalidCredentialsException::new);

        // BR-07: invalidate all sessions
        tokenService.revokeAllUserTokens(user.getId());

        // Reset failed attempts and unlock
        userPublicService.resetFailedAttempts(user.getId());

        eventPublisher.publishEvent(new PasswordResetEvent(user.getId(), LocalDateTime.now()));
    }

    // ── Magic link login (event registration) ──
    @Transactional
    public AuthResponse magicLogin(String token, String ipAddress) {
        EventMagicToken magicToken = magicLinkTokenService.validateAndConsume(token);

        UserSnapshot user = userPublicService.findById(magicToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", magicToken.getUserId()));

        LockState lockState = userPublicService.getLockState(user.getId());
        if (lockState.isLocked()) {
            throw new AccountLockedException(lockState.getLockedUntil());
        }

        userPublicService.activateParticipant(user.getId());
        userPublicService.resetFailedAttempts(user.getId());

        UserSnapshot activatedUser = userPublicService.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", user.getId()));

        String accessToken = jwtProvider.generateAccessToken(
                activatedUser.getId(), activatedUser.getEmail(), activatedUser.getUserType().name());
        String refreshToken = tokenService.createRefreshToken(activatedUser.getId());

        eventPublisher.publishEvent(new UserLoggedInEvent(activatedUser.getId(), ipAddress, LocalDateTime.now()));

        return buildAuthResponse(accessToken, refreshToken, activatedUser);
    }

    // ── BR-06: Handle failed login ──
    private void handleFailedLogin(UserSnapshot user, String ipAddress) {
        userPublicService.incrementFailedAttempts(user.getId());
        LockState lockState = userPublicService.getLockState(user.getId());

        eventPublisher.publishEvent(new LoginFailedEvent(
                user.getEmail(), ipAddress, lockState.getFailedAttempts(), LocalDateTime.now()));

        if (lockState.getFailedAttempts() >= maxFailedAttempts) {
            LocalDateTime lockUntil = LocalDateTime.now().plusMinutes(lockDurationMinutes);
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
