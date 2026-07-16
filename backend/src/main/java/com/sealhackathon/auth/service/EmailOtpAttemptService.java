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
}
