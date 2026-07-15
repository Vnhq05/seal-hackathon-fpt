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

    private final EmailOtpTokenRepository emailOtpTokenRepository;

    @Value("${app.otp.expiration-seconds:180}")
    private int expirationSeconds;

    @Value("${app.otp.resend-cooldown-seconds:300}")
    private int resendCooldownSeconds;

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
                .build();
        emailOtpTokenRepository.save(token);
        return plaintext;
    }

    @Transactional
    public EmailOtpToken validate(UUID userId, String plaintext) {
        EmailOtpToken token = emailOtpTokenRepository
                .findByUserIdAndCodeAndUsedFalse(userId, TokenHasher.hash(plaintext))
                .orElseThrow(() -> new BusinessException(
                        "Invalid verification code.", HttpStatus.BAD_REQUEST) {});

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            token.setUsed(true);
            emailOtpTokenRepository.save(token);
            throw new BusinessException(
                    "This verification code has expired. Please request a new one.",
                    HttpStatus.GONE) {};
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
