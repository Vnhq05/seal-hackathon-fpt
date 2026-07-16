package com.sealhackathon.auth.service;

import com.sealhackathon.auth.domain.EmailOtpToken;
import com.sealhackathon.auth.repository.EmailOtpTokenRepository;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.util.TokenHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailOtpServiceTest {

    @Mock private EmailOtpTokenRepository emailOtpTokenRepository;
    @Mock private EmailOtpAttemptService emailOtpAttemptService;

    @InjectMocks private EmailOtpService emailOtpService;

    @BeforeEach
    void injectConfig() {
        ReflectionTestUtils.setField(emailOtpService, "expirationSeconds", 180);
        ReflectionTestUtils.setField(emailOtpService, "resendCooldownSeconds", 300);
        ReflectionTestUtils.setField(emailOtpService, "maxAttempts", 5);
    }

    @Test
    void create_shouldPersistHashOfSixDigitCode_withZeroAttempts() {
        UUID userId = UUID.randomUUID();
        when(emailOtpTokenRepository.save(any(EmailOtpToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        String code = emailOtpService.create(userId);

        assertThat(code).matches("^\\d{6}$");
        verify(emailOtpTokenRepository).invalidateAllByUserId(userId);

        ArgumentCaptor<EmailOtpToken> captor = ArgumentCaptor.forClass(EmailOtpToken.class);
        verify(emailOtpTokenRepository).save(captor.capture());
        EmailOtpToken saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getCode()).isEqualTo(TokenHasher.hash(code));
        assertThat(saved.getCode()).isNotEqualTo(code);
        assertThat(saved.isUsed()).isFalse();
        assertThat(saved.getAttempts()).isZero();
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now().plusSeconds(179));
        assertThat(saved.getResendAllowedAt()).isAfter(LocalDateTime.now().plusSeconds(299));
    }

    @Test
    void validate_shouldThrowAndRecordAttempt_whenCodeWrong() {
        UUID userId = UUID.randomUUID();
        UUID tokenId = UUID.randomUUID();
        EmailOtpToken token = EmailOtpToken.builder()
                .userId(userId)
                .code(TokenHasher.hash("123456"))
                .expiresAt(LocalDateTime.now().plusMinutes(2))
                .resendAllowedAt(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .used(false)
                .build();
        token.setId(tokenId);

        when(emailOtpTokenRepository.findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(userId))
                .thenReturn(Optional.of(token));
        when(emailOtpAttemptService.recordFailedAttempt(tokenId, 5)).thenReturn(1);

        assertThatThrownBy(() -> emailOtpService.validate(userId, "000000"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Invalid verification code.")
                .satisfies(ex -> assertThat(((BusinessException) ex).getHttpStatus())
                        .isEqualTo(HttpStatus.BAD_REQUEST));

        verify(emailOtpAttemptService).recordFailedAttempt(tokenId, 5);
    }

    @Test
    void validate_shouldThrow_whenNoActiveToken() {
        UUID userId = UUID.randomUUID();
        when(emailOtpTokenRepository.findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> emailOtpService.validate(userId, "123456"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Invalid verification code.");

        verify(emailOtpAttemptService, never()).recordFailedAttempt(any(), anyInt());
    }

    @Test
    void validate_shouldThrow_whenAttemptsAlreadyAtMax() {
        UUID userId = UUID.randomUUID();
        EmailOtpToken token = EmailOtpToken.builder()
                .userId(userId)
                .code(TokenHasher.hash("123456"))
                .expiresAt(LocalDateTime.now().plusMinutes(2))
                .resendAllowedAt(LocalDateTime.now().plusMinutes(5))
                .attempts(5)
                .used(false)
                .build();
        token.setId(UUID.randomUUID());

        when(emailOtpTokenRepository.findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(userId))
                .thenReturn(Optional.of(token));

        assertThatThrownBy(() -> emailOtpService.validate(userId, "123456"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Invalid verification code.");

        verify(emailOtpAttemptService, never()).recordFailedAttempt(any(), anyInt());
    }

    @Test
    void validate_shouldReturnToken_whenCodeCorrect() {
        UUID userId = UUID.randomUUID();
        String code = "123456";
        EmailOtpToken token = EmailOtpToken.builder()
                .userId(userId)
                .code(TokenHasher.hash(code))
                .expiresAt(LocalDateTime.now().plusMinutes(2))
                .resendAllowedAt(LocalDateTime.now().plusMinutes(5))
                .attempts(2)
                .used(false)
                .build();
        token.setId(UUID.randomUUID());

        when(emailOtpTokenRepository.findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(userId))
                .thenReturn(Optional.of(token));

        EmailOtpToken result = emailOtpService.validate(userId, code);

        assertThat(result).isSameAs(token);
        verify(emailOtpAttemptService, never()).recordFailedAttempt(any(), anyInt());
    }

    @Test
    void validate_shouldThrow_whenExpired() {
        UUID userId = UUID.randomUUID();
        String code = "123456";
        EmailOtpToken expired = EmailOtpToken.builder()
                .userId(userId)
                .code(TokenHasher.hash(code))
                .expiresAt(LocalDateTime.now().minusSeconds(1))
                .resendAllowedAt(LocalDateTime.now().minusSeconds(1))
                .attempts(0)
                .build();
        expired.setId(UUID.randomUUID());
        when(emailOtpTokenRepository.findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(userId))
                .thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> emailOtpService.validate(userId, code))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getHttpStatus())
                        .isEqualTo(HttpStatus.GONE));

        verify(emailOtpAttemptService, never()).recordFailedAttempt(any(), anyInt());
        // Burning has to happen off this transaction: the GONE throw above rolls it back.
        verify(emailOtpAttemptService).burnExpired(expired.getId());
    }

    @Test
    void resend_shouldThrow_whenCooldownNotElapsed() {
        UUID userId = UUID.randomUUID();
        EmailOtpToken latest = EmailOtpToken.builder()
                .userId(userId)
                .code(TokenHasher.hash("111111"))
                .expiresAt(LocalDateTime.now().plusMinutes(2))
                .resendAllowedAt(LocalDateTime.now().plusSeconds(120))
                .build();
        when(emailOtpTokenRepository.findTopByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(Optional.of(latest));

        assertThatThrownBy(() -> emailOtpService.resend(userId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Please wait")
                .hasMessageContaining("seconds");
    }

    @Test
    void markUsed_shouldSetUsedFlag() {
        EmailOtpToken token = EmailOtpToken.builder()
                .userId(UUID.randomUUID())
                .code(TokenHasher.hash("654321"))
                .used(false)
                .build();
        when(emailOtpTokenRepository.save(token)).thenReturn(token);

        emailOtpService.markUsed(token);

        assertThat(token.isUsed()).isTrue();
        verify(emailOtpTokenRepository).save(token);
    }
}
