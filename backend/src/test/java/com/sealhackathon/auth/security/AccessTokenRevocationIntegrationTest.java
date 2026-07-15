package com.sealhackathon.auth.security;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Access tokens must be rejected immediately on delete / deactivate / demote / invalidate,
 * without waiting for the 7-day access-token lifetime.
 * Requires Docker + SQL Server Testcontainers (BaseIntegrationTest).
 */
class AccessTokenRevocationIntegrationTest extends BaseIntegrationTest {

    @Autowired private UserService userService;
    @Autowired private AuthPublicService authPublicService;

    @Test
    void oldAccessToken_rejectedImmediately_afterSoftDelete() throws Exception {
        User admin = createAdmin();
        User student = createStudent();
        String token = tokenFor(student);

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        userService.deleteUser(student.getId(), admin.getId());

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void oldAccessToken_rejectedImmediately_afterDeactivate() throws Exception {
        User admin = createAdmin();
        User student = createStudent();
        String token = tokenFor(student);

        userService.deactivateUser(student.getId(), admin.getId());

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void oldAccessToken_usesDbRole_afterDemote() throws Exception {
        User student = createStudent();
        // Token still claims SYSTEM_ADMIN; DB role is FPT_STUDENT → must not pass admin-only APIs.
        String forgedAdminClaimToken = jwtProvider.generateAccessToken(
                student.getId(), student.getEmail(), UserType.SYSTEM_ADMIN.name());

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + forgedAdminClaimToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        // Same token still authenticates as student for /me.
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + forgedAdminClaimToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void oldAccessToken_rejectedImmediately_afterInvalidateAllSessions() throws Exception {
        User student = createStudent();
        String token = tokenFor(student);

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Ensure watermark is strictly after JWT iat (second precision).
        Thread.sleep(1100);
        authPublicService.invalidateAllSessions(student.getId());

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void oldAccessToken_rejectedImmediately_afterHardDeleteFromDb() throws Exception {
        User student = createStudent();
        String token = tokenFor(student);

        userRepository.delete(student);

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
