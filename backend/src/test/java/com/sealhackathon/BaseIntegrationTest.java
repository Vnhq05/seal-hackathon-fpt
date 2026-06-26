package com.sealhackathon;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sealhackathon.auth.security.JwtProvider;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("seal_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired protected MockMvc mockMvc;
    @Autowired protected ObjectMapper objectMapper;
    @Autowired protected UserRepository userRepository;
    @Autowired protected PasswordEncoder passwordEncoder;
    @Autowired protected JwtProvider jwtProvider;

    @BeforeEach
    protected void cleanDatabase() {
        userRepository.deleteAll();
    }

    protected User createUser(String email, UserType type, AccountStatus status) {
        return userRepository.save(User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("password123"))
                .fullName("Test " + type.name())
                .userType(type)
                .status(status)
                .build());
    }

    protected String tokenFor(User user) {
        return jwtProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getUserType().name());
    }

    protected User createAdmin() {
        return createUser("admin@test.com", UserType.SYSTEM_ADMIN, AccountStatus.ACTIVE);
    }

    protected User createCoordinator() {
        return createUser("coord@test.com", UserType.EVENT_COORDINATOR, AccountStatus.ACTIVE);
    }

    protected User createJudge() {
        return createUser("judge@test.com", UserType.LECTURER, AccountStatus.ACTIVE);
    }

    protected User createMentor() {
        return createUser("mentor@test.com", UserType.LECTURER, AccountStatus.ACTIVE);
    }

    protected User createStudent() {
        return createUser("student@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);
    }
}
