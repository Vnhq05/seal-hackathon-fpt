package com.sealhackathon.auth.service;

import com.sealhackathon.auth.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Revokes a refresh token in an independent transaction.
 *
 * Not a security fix: {@code expiresAt} rejects an expired token whether or not the revoked flag was
 * ever written. But {@code validateRefreshToken} marked it revoked and then threw, so the rollback
 * took the flag back and the row stayed {@code revoked=false} forever -- which is why expired
 * refresh tokens accumulate instead of being retired on first use.
 *
 * Separate bean rather than a method on TokenService: a self-invocation would not pass through the
 * proxy and REQUIRES_NEW would be silently ignored. Same pattern as EmailOtpAttemptService.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenRevocationService {

    private final RefreshTokenRepository refreshTokenRepository;

    /** Callers must not write the row on the outer transaction first, or its lock would block this one. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void revokeExpired(UUID refreshTokenId) {
        refreshTokenRepository.findById(refreshTokenId)
                .ifPresent(token -> token.setRevoked(true));
    }
}
