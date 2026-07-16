package com.sealhackathon.auth.service;

import com.sealhackathon.auth.domain.EmailOtpToken;
import com.sealhackathon.auth.repository.EmailOtpTokenRepository;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.util.TokenHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailOtpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String INVALID_CODE_MESSAGE = "Invalid verification code.";

    private final EmailOtpTokenRepository emailOtpTokenRepository;
    private final EmailOtpAttemptService emailOtpAttemptService;

    @Value("${app.otp.expiration-seconds:180}")
    private int expirationSeconds;

    @Value("${app.otp.resend-cooldown-seconds:300}")
    private int resendCooldownSeconds;

    @Value("${app.otp.max-attempts:5}")
    private int maxAttempts;

    @Transactional
    public String create(UUID userId) {
        emailOtpTokenRepository.invalidateAllByUserId(userId);

        LocalDateTime now = LocalDateTime.now();
        String plaintext = generateCode();

        EmailOtpToken token = EmailOtpToken.builder()
                .userId(userId)
                .code(TokenHasher.hash(plaintext))
                .expiresAt(now.plusSeconds(expirationSeconds))
                .resendAllowedAt(now.plusSeconds(resendCooldownSeconds))
                .attempts(0)
                .build();
        emailOtpTokenRepository.save(token);
        return plaintext;
    }

    @Transactional
    public EmailOtpToken validate(UUID userId, String plaintext) {
        EmailOtpToken token = emailOtpTokenRepository
                .findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new BusinessException(INVALID_CODE_MESSAGE, HttpStatus.BAD_REQUEST) {});

        if (token.getAttempts() >= maxAttempts) {
            throw new BusinessException(INVALID_CODE_MESSAGE, HttpStatus.BAD_REQUEST) {};
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            // REQUIRES_NEW — must survive the rollback the throw below causes
            emailOtpAttemptService.burnExpired(token.getId());
            throw new BusinessException(
                    "This verification code has expired. Please request a new one.",
                    HttpStatus.GONE) {};
        }

        if (!TokenHasher.hash(plaintext).equals(token.getCode())) {
            // REQUIRES_NEW — must survive rollback of this transaction
            emailOtpAttemptService.recordFailedAttempt(token.getId(), maxAttempts);
            throw new BusinessException(INVALID_CODE_MESSAGE, HttpStatus.BAD_REQUEST) {};
        }

        return token;
    }

    @Transactional
    public String resend(UUID userId) {
        emailOtpTokenRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .ifPresent(latest -> {
                    LocalDateTime now = LocalDateTime.now();
                    if (latest.getResendAllowedAt().isAfter(now)) {
                        long seconds = Duration.between(now, latest.getResendAllowedAt()).getSeconds();
                        throw new BusinessException(
                                "Please wait " + seconds + " seconds before requesting a new OTP",
                                HttpStatus.TOO_MANY_REQUESTS) {};
                    }
                });

        return create(userId);
    }

    @Transactional
    public void markUsed(EmailOtpToken token) {
        token.setUsed(true);
        emailOtpTokenRepository.save(token);
    }

    private String generateCode() {
        int value = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d", value);
    }
}
