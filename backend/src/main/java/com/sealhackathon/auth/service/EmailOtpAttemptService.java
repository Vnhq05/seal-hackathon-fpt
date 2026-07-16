package com.sealhackathon.auth.service;

import com.sealhackathon.auth.domain.EmailOtpToken;
import com.sealhackathon.auth.repository.EmailOtpTokenRepository;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Persists OTP failed attempts in an independent transaction so counters survive
 * rollback of the outer {@code validate}/{@code verifyOtp} transaction (same pattern as login lockout).
 */
@Service
@RequiredArgsConstructor
public class EmailOtpAttemptService {

    private final EmailOtpTokenRepository emailOtpTokenRepository;

    /**
     * Increments attempts and burns the token ({@code used=true}) when {@code maxAttempts} is reached.
     *
     * @return the new attempt count after increment
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int recordFailedAttempt(UUID tokenId, int maxAttempts) {
        EmailOtpToken token = emailOtpTokenRepository.findById(tokenId)
                .orElseThrow(() -> new ResourceNotFoundException("EmailOtpToken", "id", tokenId));
        int next = token.getAttempts() + 1;
        token.setAttempts(next);
        if (next >= maxAttempts) {
            token.setUsed(true);
        }
        emailOtpTokenRepository.save(token);
        return next;
    }

    /**
     * Burns an expired token. Not a security fix -- {@code expiresAt} already rejects it either way
     * -- but the caller marks it used and then throws, so the rollback took the flag back and the
     * row stayed {@code used=false} forever, kept alive by
     * {@code findTopByUserIdAndUsedFalseOrderByCreatedAtDesc} on every retry.
     *
     * <p>Callers must not write the row on the outer transaction first, or its lock would block this one.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void burnExpired(UUID tokenId) {
        emailOtpTokenRepository.findById(tokenId).ifPresent(token -> token.setUsed(true));
    }
}
