package com.sealhackathon.user.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminUserControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void approveByPatch_shouldActivateAccount() throws Exception {
        User admin = createAdmin();
        User pending = createUser("patch@test.com", UserType.FPT_STUDENT, AccountStatus.PENDING);

        mockMvc.perform(patch("/api/admin/users/{userId}/approve", pending.getId())
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));
    }

    // ── BR-01: Approve pending account ──

    @Test
    void approve_shouldActivateAccount() throws Exception {
        User admin = createAdmin();
        User pending = createUser("pending@test.com", UserType.FPT_STUDENT, AccountStatus.PENDING);

        mockMvc.perform(post("/api/admin/users/approve")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"userId":"%s","action":"APPROVE"}
                                """, pending.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));
    }

    // ── BR-01: Reject with reason ──

    @Test
    void reject_shouldSetRejectedStatus() throws Exception {
        User admin = createAdmin();
        User pending = createUser("reject@test.com", UserType.EXTERNAL_STUDENT, AccountStatus.PENDING);

        mockMvc.perform(post("/api/admin/users/approve")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"userId":"%s","action":"REJECT","reason":"Invalid student ID"}
                                """, pending.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("REJECTED")));
    }

    // ── BR-02: Create internal account ──

    @Test
    void createInternal_shouldCreateActiveAccount() throws Exception {
        User admin = createAdmin();

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"newlecturer@test.com","password":"pass123",
                                 "fullName":"New Lecturer","userType":"LECTURER"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.userType", is("LECTURER")));
    }

    // ── BR-02: Reject FPT_STUDENT as internal ──

    @Test
    void createInternal_shouldReject_studentRole() throws Exception {
        User admin = createAdmin();

        mockMvc.perform(post("/api/admin/users/internal")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"student@test.com","password":"pass123",
                                 "fullName":"Student","userType":"FPT_STUDENT"}
                                """))
                .andExpect(status().isBadRequest());
    }

    // ── Security: Non-admin cannot access ──

    @Test
    void adminEndpoint_shouldReturn403_forNonAdmin() throws Exception {
        User student = createStudent();

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + tokenFor(student)))
                .andExpect(status().isForbidden());
    }

    // ── List pending accounts ──

    @Test
    void getPending_shouldReturnOnlyPending() throws Exception {
        User admin = createAdmin();
        createUser("p1@test.com", UserType.FPT_STUDENT, AccountStatus.PENDING);
        createUser("a1@test.com", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        mockMvc.perform(get("/api/admin/users/pending")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)));
    }
}
