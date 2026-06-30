package com.sealhackathon.auth.service;

import com.sealhackathon.auth.domain.EmailOtpToken;
import com.sealhackathon.auth.repository.EmailOtpTokenRepository;
import com.sealhackathon.common.exception.BusinessException;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailOtpServiceTest {

    @Mock private EmailOtpTokenRepository emailOtpTokenRepository;

    @InjectMocks private EmailOtpService emailOtpService;

    @Test
    void create_shouldPersistSixDigitCode() {
        UUID userId = UUID.randomUUID();
        ReflectionTestUtils.setField(emailOtpService, "expirationSeconds", 180);
        ReflectionTestUtils.setField(emailOtpService, "resendCooldownSeconds", 300);
        when(emailOtpTokenRepository.save(any(EmailOtpToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        String code = emailOtpService.create(userId);

        assertThat(code).matches("^\\d{6}$");
        verify(emailOtpTokenRepository).invalidateAllByUserId(userId);

        ArgumentCaptor<EmailOtpToken> captor = ArgumentCaptor.forClass(EmailOtpToken.class);
        verify(emailOtpTokenRepository).save(captor.capture());
        EmailOtpToken saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getCode()).isEqualTo(code);
        assertThat(saved.isUsed()).isFalse();
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now().plusSeconds(179));
        assertThat(saved.getResendAllowedAt()).isAfter(LocalDateTime.now().plusSeconds(299));
    }

    @Test
    void validate_shouldThrow_whenCodeNotFound() {
        UUID userId = UUID.randomUUID();
        when(emailOtpTokenRepository.findByUserIdAndCodeAndUsedFalse(userId, "123456"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> emailOtpService.validate(userId, "123456"))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getHttpStatus())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void validate_shouldThrow_whenExpired() {
        UUID userId = UUID.randomUUID();
        EmailOtpToken expired = EmailOtpToken.builder()
                .userId(userId)
                .code("123456")
                .expiresAt(LocalDateTime.now().minusSeconds(1))
                .resendAllowedAt(LocalDateTime.now().minusSeconds(1))
                .build();
        when(emailOtpTokenRepository.findByUserIdAndCodeAndUsedFalse(userId, "123456"))
                .thenReturn(Optional.of(expired));
        when(emailOtpTokenRepository.save(any())).thenReturn(expired);

        assertThatThrownBy(() -> emailOtpService.validate(userId, "123456"))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getHttpStatus())
                        .isEqualTo(HttpStatus.GONE));
    }

    @Test
    void resend_shouldThrow_whenCooldownNotElapsed() {
        UUID userId = UUID.randomUUID();
        EmailOtpToken latest = EmailOtpToken.builder()
                .userId(userId)
                .code("111111")
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
                .code("654321")
                .used(false)
                .build();
        when(emailOtpTokenRepository.save(token)).thenReturn(token);

        emailOtpService.markUsed(token);

        assertThat(token.isUsed()).isTrue();
        verify(emailOtpTokenRepository).save(token);
    }
}
