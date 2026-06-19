package com.sealhackathon.auth.service;

import com.sealhackathon.auth.domain.PasswordResetToken;
import com.sealhackathon.auth.domain.RefreshToken;
import com.sealhackathon.auth.repository.PasswordResetTokenRepository;
import com.sealhackathon.auth.repository.RefreshTokenRepository;
import com.sealhackathon.common.exception.InvalidTokenException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenServiceTest {

    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;

    @InjectMocks private TokenService tokenService;

    @Test
    void createRefreshToken_shouldSaveAndReturnToken() {
        UUID userId = UUID.randomUUID();
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        String token = tokenService.createRefreshToken(userId);

        assertThat(token).isNotBlank();
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(userId);
        assertThat(captor.getValue().isRevoked()).isFalse();
    }

    @Test
    void validateRefreshToken_shouldThrow_whenTokenNotFound() {
        when(refreshTokenRepository.findByTokenAndRevokedFalse("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tokenService.validateRefreshToken("bad"))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void validateRefreshToken_shouldThrow_whenTokenExpired() {
        RefreshToken expired = RefreshToken.builder()
                .token("expired")
                .userId(UUID.randomUUID())
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build();
        when(refreshTokenRepository.findByTokenAndRevokedFalse("expired"))
                .thenReturn(Optional.of(expired));
        when(refreshTokenRepository.save(any())).thenReturn(expired);

        assertThatThrownBy(() -> tokenService.validateRefreshToken("expired"))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void validateRefreshToken_shouldReturnToken_whenValid() {
        RefreshToken valid = RefreshToken.builder()
                .token("valid")
                .userId(UUID.randomUUID())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        when(refreshTokenRepository.findByTokenAndRevokedFalse("valid"))
                .thenReturn(Optional.of(valid));

        RefreshToken result = tokenService.validateRefreshToken("valid");

        assertThat(result.getToken()).isEqualTo("valid");
    }

    @Test
    void revokeAllUserTokens_shouldDelegateToRepository() {
        UUID userId = UUID.randomUUID();
        tokenService.revokeAllUserTokens(userId);
        verify(refreshTokenRepository).revokeAllByUserId(userId);
    }

    @Test
    void validatePasswordResetToken_shouldThrow_whenExpired() {
        PasswordResetToken expired = PasswordResetToken.builder()
                .token("exp")
                .userId(UUID.randomUUID())
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .build();
        when(passwordResetTokenRepository.findByTokenAndUsedFalse("exp"))
                .thenReturn(Optional.of(expired));
        when(passwordResetTokenRepository.save(any())).thenReturn(expired);

        assertThatThrownBy(() -> tokenService.validatePasswordResetToken("exp"))
                .isInstanceOf(InvalidTokenException.class);
    }
}
