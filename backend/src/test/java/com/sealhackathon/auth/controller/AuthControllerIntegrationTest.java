package com.sealhackathon.auth.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerIntegrationTest extends BaseIntegrationTest {

    // ── BR-01: Registration → Pending ──

    @Test
    void register_shouldReturn201_andStatusPending() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"new@fpt.edu.vn","password":"Password123","fullName":"Nguyen A",
                                 "studentId":"SE123456","userType":"FPT_STUDENT"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", notNullValue()));
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
    void register_shouldReturn409_whenEmailExists() throws Exception {
        createUser("exists@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.PENDING);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"exists@fpt.edu.vn","password":"Password123","fullName":"Dup",
                                 "studentId":"SE000002","userType":"FPT_STUDENT"}
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

    // ── Security: unauthenticated access ──

    @Test
    void protectedEndpoint_shouldReturn401_withoutToken() throws Exception {
        mockMvc.perform(post("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
