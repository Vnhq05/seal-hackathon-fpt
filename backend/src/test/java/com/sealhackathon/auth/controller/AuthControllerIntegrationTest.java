package com.sealhackathon.auth.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.user.domain.User;
import com.icegreen.greenmail.util.GreenMailUtil;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerIntegrationTest extends BaseIntegrationTest {

    private static final Pattern OTP_IN_HTML = Pattern.compile(">(\\d{6})<");

    @Autowired private JdbcTemplate jdbcTemplate;

    // ── BR-01: Registration → OTP ──

    @Test
    void register_shouldReturn201_andOtpMessage() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"new@fpt.edu.vn","password":"Password123","fullName":"Nguyen A",
                                 "studentId":"SE123456","userType":"FPT_STUDENT","studentStanding":"ENROLLED"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("OTP sent to your email. Please verify to continue.")))
                .andExpect(jsonPath("$.data", notNullValue()));
    }

    @Test
    void verifyOtp_shouldActivateFptStudent_andAllowLogin() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"verify@fpt.edu.vn","password":"Password123","fullName":"Verify User",
                                 "studentId":"SE123457","userType":"FPT_STUDENT","studentStanding":"ENROLLED"}
                                """))
                .andExpect(status().isCreated());

        String otp = otpFromLastMail();

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"verify@fpt.edu.vn","otp":"%s"}
                                """.formatted(otp)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Email verified. Your account is now active. You can sign in.")));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"verify@fpt.edu.vn","password":"Password123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken", notNullValue()));
    }

    private String otpFromLastMail() {
        MimeMessage[] mails = receivedMails();
        assertThat(mails).as("OTP email should arrive via GreenMail").isNotEmpty();
        String body = GreenMailUtil.getBody(mails[mails.length - 1]);
        Matcher matcher = OTP_IN_HTML.matcher(body);
        assertThat(matcher.find()).as("6-digit OTP in HTML body").isTrue();
        return matcher.group(1);
    }

    // ── BR-02: Internal roles cannot self-register ──

    @Test
    void register_shouldReturn400_whenInternalRole() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"mentor@test.com","password":"pass123","fullName":"Mentor",
                                 "userType":"MENTOR"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    // ── BR-03: Password too short ──

    @Test
    void register_shouldReturn400_whenPasswordTooShort() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"short@fpt.edu.vn","password":"12345","fullName":"Short",
                                 "studentId":"SE000001","userType":"FPT_STUDENT"}
                                """))
                .andExpect(status().isBadRequest());
    }

    // ── BR-04: Duplicate email ──

    @Test
    void register_shouldReturn409_whenEmailExistsAndActive() throws Exception {
        createUser("exists@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"exists@fpt.edu.vn","password":"Password123","fullName":"Dup",
                                 "studentId":"SE000002","userType":"FPT_STUDENT","studentStanding":"ENROLLED"}
                                """))
                .andExpect(status().isConflict());
    }

    // ── BR-05: Login success ──

    @Test
    void login_shouldReturnTokens_whenCredentialsValid() throws Exception {
        createUser("active@test.com", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"active@test.com","password":"password123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("active@test.com")));
    }

    // ── BR-05: Pending account cannot login ──

    @Test
    void login_shouldReturn403_whenAccountPending() throws Exception {
        createUser("pending@test.com", UserType.FPT_STUDENT, AccountStatus.PENDING);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"pending@test.com","password":"password123"}
                                """))
                .andExpect(status().isForbidden());
    }

    // ── BR-05: Wrong password ──

    @Test
    void login_shouldReturn401_whenWrongPassword() throws Exception {
        createUser("wrong@test.com", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"wrong@test.com","password":"badpassword"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    // ── BR-06: Account lock after 5 failures ──

    @Test
    void login_shouldLockAccount_after5Failures() throws Exception {
        createUser("lock@test.com", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email":"lock@test.com","password":"wrong"}
                            """));
        }

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"lock@test.com","password":"password123"}
                                """))
                .andExpect(status().isLocked());
    }

    @Test
    void login_shouldPersistFailedAttemptsInDb_afterWrongPassword() throws Exception {
        User user = createUser("persist-fail@test.com", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"persist-fail@test.com","password":"wrong"}
                                """))
                .andExpect(status().isUnauthorized());

        entityManager.clear();
        User reloaded = userRepository.findById(user.getId()).orElseThrow();
        assertThat(reloaded.getFailedLoginAttempts()).isEqualTo(1);
        assertThat(reloaded.getLockedUntil()).isNull();
    }

    @Test
    void login_shouldAuditFailure_afterWrongPassword() throws Exception {
        createUser("audit-fail@test.com", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"audit-fail@test.com","password":"wrong"}
                                """))
                .andExpect(status().isUnauthorized());

        // Read outside any transaction: login() rolls back on bad credentials, so this passes only
        // if the audit write survived that rollback rather than riding on it.
        entityManager.clear();
        List<String> payloads = jdbcTemplate.queryForList(
                "SELECT new_value FROM audit_logs WHERE action = 'LOGIN_FAILED'", String.class);
        assertThat(payloads).hasSize(1);
        assertThat(payloads.get(0))
                .contains("audit-fail@test.com")
                .contains("\"attempt\":1");
    }

    @Test
    void login_shouldSetLockedUntil_after5Failures_andRejectCorrectPassword() throws Exception {
        User user = createUser("lock-until@test.com", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email":"lock-until@test.com","password":"wrong"}
                            """));
        }

        entityManager.clear();
        User reloaded = userRepository.findById(user.getId()).orElseThrow();
        assertThat(reloaded.getFailedLoginAttempts()).isEqualTo(5);
        assertThat(reloaded.getLockedUntil()).isNotNull();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"lock-until@test.com","password":"password123"}
                                """))
                .andExpect(status().isLocked());
    }

    // ── Security: unauthenticated access ──

    @Test
    void protectedEndpoint_shouldReturn401_withoutToken() throws Exception {
        mockMvc.perform(post("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
