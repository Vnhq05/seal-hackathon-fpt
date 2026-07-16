package com.sealhackathon;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sealhackathon.auth.security.JwtProvider;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.support.DockerAvailabilityCondition;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MSSQLServerContainer;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ExtendWith(DockerAvailabilityCondition.class)
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @SuppressWarnings("resource")
    static final MSSQLServerContainer<?> mssql;

    static {
        mssql = new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2022-latest")
                .acceptLicense()
                .withPassword("Seal_Test_Password_123");
        mssql.start();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mssql::getJdbcUrl);
        registry.add("spring.datasource.username", mssql::getUsername);
        registry.add("spring.datasource.password", mssql::getPassword);
        registry.add("spring.datasource.driver-class-name",
                () -> "com.microsoft.sqlserver.jdbc.SQLServerDriver");
    }

    /** Application tables wiped before each test (children → parents). Keeps flyway_schema_history / sysdiagrams. */
    private static final String[] WIPE_STATEMENTS = {
            "DELETE FROM submission_attachments",
            "DELETE FROM judge_comments",
            "DELETE FROM judge_score_details",
            "UPDATE submissions SET current_version_id = NULL",
            "DELETE FROM submission_versions",
            "DELETE FROM judge_scores",
            "DELETE FROM score_review_requests",
            "DELETE FROM submissions",
            "DELETE FROM team_judge_assignments",
            "DELETE FROM team_progress_alerts",
            "DELETE FROM mentor_chat_messages",
            "DELETE FROM mentor_feedbacks",
            "DELETE FROM participant_feedbacks",
            "DELETE FROM participation_certificates",
            "DELETE FROM team_awards",
            "DELETE FROM finalist_selections",
            "DELETE FROM team_join_requests",
            "DELETE FROM team_leave_requests",
            "DELETE FROM team_needed_roles",
            "DELETE FROM invitations",
            "DELETE FROM mentor_invitations",
            "DELETE FROM mentor_teams",
            "DELETE FROM team_members",
            "DELETE FROM teams",
            "DELETE FROM advancements",
            "DELETE FROM disputes",
            "DELETE FROM rankings",
            "DELETE FROM published_results",
            "DELETE FROM criteria",
            "DELETE FROM judge_assignments",
            "DELETE FROM rounds",
            "DELETE FROM finalist_contested_slot_teams",
            "DELETE FROM finalist_contested_slots",
            "DELETE FROM track_draw_queue",
            "DELETE FROM track_draw_sessions",
            "DELETE FROM competition_groups",
            "DELETE FROM tracks",
            "DELETE FROM notification_recipients",
            "DELETE FROM notifications",
            "DELETE FROM event_enrollments",
            "DELETE FROM event_magic_tokens",
            "DELETE FROM event_schedules",
            "DELETE FROM allowed_email_domains",
            "DELETE FROM event_judge_assignments",
            "DELETE FROM event_mentor_assignments",
            "DELETE FROM event_tiebreaker_criteria",
            "DELETE FROM honored_guests",
            "DELETE FROM mentor_assignments",
            "DELETE FROM prizes",
            "DELETE FROM hackathon_events",
            "DELETE FROM scoring_template_criteria",
            "DELETE FROM scoring_templates",
            "DELETE FROM email_otp_tokens",
            "DELETE FROM password_reset_tokens",
            "DELETE FROM refresh_tokens",
            "DELETE FROM audit_logs",
            "DELETE FROM event_publication",
            "DELETE FROM system_config",
            "DELETE FROM users",
    };

    @Autowired protected MockMvc mockMvc;
    @Autowired protected ObjectMapper objectMapper;
    @Autowired protected UserRepository userRepository;
    @Autowired protected PasswordEncoder passwordEncoder;
    @Autowired protected JwtProvider jwtProvider;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private EntityManager entityManager;

    @BeforeEach
    protected void cleanDatabase() {
        for (String sql : WIPE_STATEMENTS) {
            jdbcTemplate.update(sql);
        }
        entityManager.clear();
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
