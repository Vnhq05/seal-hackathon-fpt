package com.sealhackathon.infrastructure.config;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.StudentStanding;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies dev seed re-sync allows login with documented credentials after stale DB state.
 */
class DevSeedLoginIntegrationTest extends BaseIntegrationTest {

    @Autowired private DataSeeder dataSeeder;

    @Test
    void login_shouldSucceedForCoordinator_afterDataSeederResync() throws Exception {
        userRepository.save(User.builder()
                .email("coordinator@seal.com")
                .passwordHash(passwordEncoder.encode("wrong-password"))
                .fullName("Event Coordinator")
                .userType(UserType.EVENT_COORDINATOR)
                .status(AccountStatus.PENDING)
                .failedLoginAttempts(5)
                .lockedUntil(LocalDateTime.now().plusMinutes(15))
                .studentStanding(StudentStanding.GRADUATED)
                .build());

        dataSeeder.run();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"coordinator@seal.com","password":"12345678"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.userType", is("EVENT_COORDINATOR")));
    }

    @Test
    void login_shouldSucceedForLecturer_afterDataSeederResync() throws Exception {
        userRepository.save(User.builder()
                .email("lecturer1@fpt.edu.vn")
                .passwordHash("stale-hash")
                .fullName("Nguyen Van A")
                .userType(UserType.LECTURER)
                .status(AccountStatus.LOCKED)
                .failedLoginAttempts(5)
                .lockedUntil(LocalDateTime.now().plusMinutes(15))
                .studentStanding(StudentStanding.ENROLLED)
                .build());

        dataSeeder.run();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"lecturer1@fpt.edu.vn","password":"12345678"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.userType", is("LECTURER")));
    }
}
