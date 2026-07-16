package com.sealhackathon.auth.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.auth.domain.EmailOtpToken;
import com.sealhackathon.auth.repository.EmailOtpTokenRepository;
import com.sealhackathon.auth.service.EmailOtpService;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.util.TokenHasher;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * OTP attempt persistence / burn — seeds tokens directly (no SMTP / GreenMail).
 */
class EmailOtpIntegrationTest extends BaseIntegrationTest {

    private static final String CORRECT_OTP = "123456";
    private static final String WRONG_OTP = "000000";

    @Autowired private EmailOtpTokenRepository emailOtpTokenRepository;
    @Autowired private EmailOtpService emailOtpService;

    @Test
    void validate_shouldIncrementAttemptsInDb_andSurviveOuterRollback() {
        User user = createUser("otp-persist@test.com", UserType.FPT_STUDENT, AccountStatus.PENDING);
        EmailOtpToken token = seedActiveOtp(user, CORRECT_OTP, 0);

        for (int i = 1; i <= 3; i++) {
            try {
                emailOtpService.validate(user.getId(), WRONG_OTP);
            } catch (RuntimeException ignored) {
                // expected BusinessException
            }
            entityManager.clear();
            EmailOtpToken reloaded = emailOtpTokenRepository.findById(token.getId()).orElseThrow();
            assertThat(reloaded.getAttempts()).isEqualTo(i);
            assertThat(reloaded.isUsed()).isFalse();
        }
    }

    @Test
    void validate_shouldBurnToken_afterMaxAttempts_andRejectCorrectCode() {
        User user = createUser("otp-burn@test.com", UserType.FPT_STUDENT, AccountStatus.PENDING);
        EmailOtpToken token = seedActiveOtp(user, CORRECT_OTP, 0);

        for (int i = 0; i < 5; i++) {
            try {
                emailOtpService.validate(user.getId(), WRONG_OTP);
            } catch (RuntimeException ignored) {
                // expected
            }
        }

        entityManager.clear();
        EmailOtpToken burned = emailOtpTokenRepository.findById(token.getId()).orElseThrow();
        assertThat(burned.getAttempts()).isEqualTo(5);
        assertThat(burned.isUsed()).isTrue();

        try {
            emailOtpService.validate(user.getId(), CORRECT_OTP);
            throw new AssertionError("Expected rejection after burn");
        } catch (RuntimeException ex) {
            assertThat(ex.getMessage()).isEqualTo("Invalid verification code.");
        }
    }

    @Test
    void resend_shouldCreateNewTokenWithZeroAttempts_afterCooldown() {
        User user = createUser("otp-resend@test.com", UserType.FPT_STUDENT, AccountStatus.PENDING);
        EmailOtpToken old = seedActiveOtp(user, CORRECT_OTP, 3);
        old.setResendAllowedAt(LocalDateTime.now().minusSeconds(1));
        emailOtpTokenRepository.save(old);

        String newCode = emailOtpService.resend(user.getId());

        entityManager.clear();
        EmailOtpToken fresh = emailOtpTokenRepository
                .findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId())
                .orElseThrow();
        assertThat(fresh.getAttempts()).isZero();
        assertThat(fresh.getId()).isNotEqualTo(old.getId());
        assertThat(fresh.getCode()).isEqualTo(TokenHasher.hash(newCode));
        assertThat(emailOtpTokenRepository.findById(old.getId()).orElseThrow().isUsed()).isTrue();
    }

    @Test
    void verifyOtp_shouldRejectAfterMaxFailedAttempts_viaHttp() throws Exception {
        User user = createUser("otp-http@test.com", UserType.FPT_STUDENT, AccountStatus.PENDING);
        seedActiveOtp(user, CORRECT_OTP, 0);

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/verify-otp")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email":"otp-http@test.com","otp":"%s"}
                                    """.formatted(WRONG_OTP)))
                    .andExpect(status().isBadRequest());
        }

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"otp-http@test.com","otp":"%s"}
                                """.formatted(CORRECT_OTP)))
                .andExpect(status().isBadRequest());

        entityManager.clear();
        EmailOtpToken token = emailOtpTokenRepository
                .findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .orElseThrow();
        assertThat(token.getAttempts()).isEqualTo(5);
        assertThat(token.isUsed()).isTrue();
    }

    private EmailOtpToken seedActiveOtp(User user, String plaintext, int attempts) {
        return emailOtpTokenRepository.save(EmailOtpToken.builder()
                .userId(user.getId())
                .code(TokenHasher.hash(plaintext))
                .expiresAt(LocalDateTime.now().plusMinutes(3))
                .resendAllowedAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .attempts(attempts)
                .build());
    }
}
