package com.sealhackathon.auth.service;

import com.sealhackathon.auth.domain.PasswordResetToken;
import com.sealhackathon.auth.domain.RefreshToken;
import com.sealhackathon.auth.repository.PasswordResetTokenRepository;
import com.sealhackathon.auth.repository.RefreshTokenRepository;
import com.sealhackathon.common.exception.InvalidTokenException;
import com.sealhackathon.common.util.TokenHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenRevocationService refreshTokenRevocationService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${app.jwt.refresh-token-expiration-days:7}")
    private int refreshTokenExpirationDays;

    @Value("${app.jwt.password-reset-token-expiration-minutes:15}")
    private int passwordResetTokenExpirationMinutes;

    @Transactional
    public String createRefreshToken(UUID userId) {
        String plaintext = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .token(TokenHasher.hash(plaintext))
                .userId(userId)
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpirationDays))
                .build();
        refreshTokenRepository.save(refreshToken);
        return plaintext;
    }

    @Transactional
    public RefreshToken validateRefreshToken(String plaintext) {
        String tokenHash = TokenHasher.hash(plaintext);
        RefreshToken refreshToken = refreshTokenRepository.findByTokenAndRevokedFalse(tokenHash)
                .orElseThrow(InvalidTokenException::new);

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            // REQUIRES_NEW — must survive the rollback the throw below causes
            refreshTokenRevocationService.revokeExpired(refreshToken.getId());
            throw new InvalidTokenException();
        }

        return refreshToken;
    }

    @Transactional
    public void revokeRefreshToken(String plaintext) {
        refreshTokenRepository.findByTokenAndRevokedFalse(TokenHasher.hash(plaintext))
                .ifPresent(rt -> {
                    rt.setRevoked(true);
                    refreshTokenRepository.save(rt);
                });
    }

    @Transactional
    public void revokeAllUserTokens(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    @Transactional
    public String createPasswordResetToken(UUID userId) {
        passwordResetTokenRepository.invalidateAllByUserId(userId);
        String plaintext = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(TokenHasher.hash(plaintext))
                .userId(userId)
                .expiresAt(LocalDateTime.now().plusMinutes(passwordResetTokenExpirationMinutes))
                .build();
        passwordResetTokenRepository.save(resetToken);
        return plaintext;
    }

    @Transactional
    public PasswordResetToken validatePasswordResetToken(String plaintext) {
        String tokenHash = TokenHasher.hash(plaintext);
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndUsedFalse(tokenHash)
                .orElseThrow(InvalidTokenException::new);

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            resetToken.setUsed(true);
            passwordResetTokenRepository.save(resetToken);
            throw new InvalidTokenException();
        }

        return resetToken;
    }

    @Transactional
    public void markPasswordResetTokenUsed(PasswordResetToken token) {
        token.setUsed(true);
        passwordResetTokenRepository.save(token);
    }
}
