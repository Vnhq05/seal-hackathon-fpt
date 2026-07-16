package com.sealhackathon.db;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowable;

/**
 * Proves Flyway classpath migrations + Hibernate validate actually ran on SQL Server
 * (not a silent JPA create-drop / skipped Testcontainers class).
 */
class SchemaIntegrityIntegrationTest extends BaseIntegrationTest {

    private static final Pattern MIGRATION_VERSION =
            Pattern.compile("^V([0-9]+)__.*\\.sql$", Pattern.CASE_INSENSITIVE);

    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private Flyway flyway;

    @Test
    void flyway_allClasspathMigrationsAppliedSuccessfully() throws IOException {
        MigrationInfo[] pending = flyway.info().pending();
        assertThat(pending)
                .as("Flyway must have no pending migrations")
                .isEmpty();

        MigrationInfo[] applied = Arrays.stream(flyway.info().applied())
                .filter(info -> info.getVersion() != null)
                .toArray(MigrationInfo[]::new);

        assertThat(applied).isNotEmpty();
        assertThat(applied).allSatisfy(info ->
                assertThat(info.getState())
                        .as("migration V%s must not be failed", info.getVersion())
                        .isEqualTo(MigrationState.SUCCESS));

        Set<String> appliedVersions = Arrays.stream(applied)
                .map(info -> info.getVersion().toString())
                .collect(Collectors.toSet());

        Set<String> classpathVersions = classpathMigrationVersions();
        assertThat(appliedVersions)
                .as("applied Flyway versions must match classpath db/migration scripts")
                .isEqualTo(classpathVersions);
    }

    @Test
    void hibernateValidate_passed_usersTableHasSessionsInvalidatedAtFromV5() {
        // Context load already ran ddl-auto=validate; this probes the V5 column Hibernate mapped.
        Integer col = jdbcTemplate.queryForObject(
                "SELECT COL_LENGTH('dbo.users', 'sessions_invalidated_at')",
                Integer.class);
        assertThat(col).isNotNull().isPositive();
    }

    @Test
    @Transactional
    void invitationsCheck_allowsCancelled_rejectsBogus() {
        UUID teamId = insertFormingTeam();
        UUID inviterId = createUser(
                "inviter-" + UUID.randomUUID() + "@fpt.edu.vn",
                UserType.FPT_STUDENT,
                AccountStatus.ACTIVE).getId();

        assertThatCode(() -> jdbcTemplate.update(
                "INSERT INTO invitations "
                        + "(id, created_at, invitee_email, inviter_id, status, team_id) "
                        + "VALUES (?, SYSUTCDATETIME(), ?, ?, 'CANCELLED', ?)",
                UUID.randomUUID(), "invitee@fpt.edu.vn", inviterId, teamId))
                .doesNotThrowAnyException();

        Throwable bogus = catchThrowable(() -> jdbcTemplate.update(
                "INSERT INTO invitations "
                        + "(id, created_at, invitee_email, inviter_id, status, team_id) "
                        + "VALUES (?, SYSUTCDATETIME(), ?, ?, 'BOGUS', ?)",
                UUID.randomUUID(), "bogus@fpt.edu.vn", inviterId, teamId));

        assertThat(bogus).isInstanceOf(DataIntegrityViolationException.class);
        assertThat(bogus.getMessage() + " / " + bogus.getCause())
                .containsIgnoringCase("CK_invitations_status");
    }

    @Test
    @Transactional
    void notificationsCheck_allowsKnownType_rejectsBogus() {
        assertThatCode(() -> jdbcTemplate.update(
                "INSERT INTO notifications (id, created_at, message, title, type) "
                        + "VALUES (?, SYSUTCDATETIME(), ?, ?, N'TEAM_REGISTERED')",
                UUID.randomUUID(), "Hello", "Team registered"))
                .doesNotThrowAnyException();

        assertThatThrownBy(() -> jdbcTemplate.update(
                "INSERT INTO notifications (id, created_at, message, title, type) "
                        + "VALUES (?, SYSUTCDATETIME(), ?, ?, N'BOGUS')",
                UUID.randomUUID(), "Hello", "Bogus type"))
                .isInstanceOf(DataIntegrityViolationException.class)
                .satisfies(ex -> assertThat(ex.getMessage() + " / " + ex.getCause())
                        .containsIgnoringCase("CK_notifications_type"));
    }

    private Set<String> classpathMigrationVersions() throws IOException {
        Resource[] resources = new PathMatchingResourcePatternResolver()
                .getResources("classpath:db/migration/V*__*.sql");
        return Arrays.stream(resources)
                .map(Resource::getFilename)
                .map(filename -> {
                    Matcher matcher = MIGRATION_VERSION.matcher(filename);
                    assertThat(matcher.matches())
                            .as("unexpected migration filename: %s", filename)
                            .isTrue();
                    return String.valueOf(Integer.parseInt(matcher.group(1)));
                })
                .collect(Collectors.toSet());
    }

    private UUID insertFormingTeam() {
        UUID eventId = UUID.randomUUID();
        UUID leaderId = createUser(
                "schema-leader-" + UUID.randomUUID() + "@fpt.edu.vn",
                UserType.FPT_STUDENT,
                AccountStatus.ACTIVE).getId();
        UUID teamId = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO teams (id, created_at, event_id, leader_id, name, status, is_recruiting) "
                        + "VALUES (?, SYSUTCDATETIME(), ?, ?, ?, 'FORMING', 0)",
                teamId, eventId, leaderId, "Schema Check Team " + teamId);
        return teamId;
    }
}
