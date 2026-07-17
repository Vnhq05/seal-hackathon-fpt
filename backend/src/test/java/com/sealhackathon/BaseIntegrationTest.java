package com.sealhackathon;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.icegreen.greenmail.store.FolderException;
import com.icegreen.greenmail.util.GreenMail;
import com.icegreen.greenmail.util.ServerSetup;
import com.sealhackathon.auth.security.JwtProvider;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.support.DockerAvailabilityCondition;
import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
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
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.MSSQLServerContainer;

import java.util.List;
import java.util.UUID;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ExtendWith(DockerAvailabilityCondition.class)
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @SuppressWarnings("resource")
    static final MSSQLServerContainer<?> mssql;
    static final GreenMail greenMail;

    static {
        mssql = new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2022-latest")
                .acceptLicense()
                .withPassword("Seal_Test_Password_123");
        mssql.start();
        // Singleton, giống MSSQLServerContainer: một server cho cả Spring context,
        // không start/stop theo từng test class. Cổng 3025 khớp spring.mail.port
        // đã có sẵn trong application-test.yml.
        greenMail = new GreenMail(new ServerSetup(3025, "127.0.0.1", ServerSetup.PROTOCOL_SMTP));
        greenMail.start();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mssql::getJdbcUrl);
        registry.add("spring.datasource.username", mssql::getUsername);
        registry.add("spring.datasource.password", mssql::getPassword);
        registry.add("spring.datasource.driver-class-name",
                () -> "com.microsoft.sqlserver.jdbc.SQLServerDriver");
        // application.yml enables smtp.auth + starttls for Gmail; GreenMail is plain SMTP.
        registry.add("spring.mail.username", () -> "");
        registry.add("spring.mail.password", () -> "");
        registry.add("spring.mail.properties.mail.smtp.auth", () -> "false");
        registry.add("spring.mail.properties.mail.smtp.starttls.enable", () -> "false");
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
    @Autowired protected HackathonEventRepository eventRepository;
    @Autowired protected EventEnrollmentRepository enrollmentRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired protected EntityManager entityManager;
    @Autowired private TransactionTemplate transactionTemplate;

    @BeforeEach
    protected void cleanDatabase() {
        for (String sql : WIPE_STATEMENTS) {
            jdbcTemplate.update(sql);
        }
        entityManager.clear();
        try {
            greenMail.purgeEmailFromAllMailboxes();
        } catch (FolderException e) {
            throw new IllegalStateException("Failed to purge GreenMail mailboxes", e);
        }
    }

    protected MimeMessage[] receivedMails() {
        return greenMail.getReceivedMessages();
    }

    /**
     * Runs {@code action} with the embedded SMTP server stopped, so mail sending genuinely fails.
     * Mocking the mail bean cannot stand in for this: the failure has to travel out through
     * EmailService's real {@code @Transactional} proxy to reproduce what a live outage does.
     */
    protected void withMailServerDown(Runnable action) {
        greenMail.stop();
        try {
            action.run();
        } finally {
            greenMail.start();
        }
    }

    /** Sets the business owner of an event. See adr-event-owner-vs-created-by.md. */
    protected void assignEventOwner(UUID eventId, UUID ownerUserId) {
        transactionTemplate.executeWithoutResult(status ->
                eventRepository.reassignOwnership(List.of(eventId), ownerUserId));
        entityManager.clear();
    }

    protected void seedApprovedEnrollment(UUID userId, UUID eventId) {
        enrollmentRepository.save(EventEnrollment.builder()
                .userId(userId)
                .eventId(eventId)
                .status(EnrollmentStatus.APPROVED)
                .build());
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
