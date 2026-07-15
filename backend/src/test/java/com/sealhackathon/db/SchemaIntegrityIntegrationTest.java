package com.sealhackathon.db;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowable;

/**
 * Proves Flyway V0–V5 + Hibernate validate actually ran on SQL Server
 * (not a silent JPA create-drop / skipped Testcontainers class).
 */
class SchemaIntegrityIntegrationTest extends BaseIntegrationTest {

    @Autowired private JdbcTemplate jdbcTemplate;

    @Test
    void flyway_appliedVersions0Through5_successfully() {
        List<Map<String, Object>> applied = jdbcTemplate.queryForList(
                "SELECT version, success FROM flyway_schema_history "
                        + "WHERE version IS NOT NULL ORDER BY installed_rank");

        assertThat(applied)
                .extracting(row -> String.valueOf(row.get("version")))
                .containsExactly("0", "1", "2", "3", "4", "5");
        assertThat(applied).allSatisfy(row -> {
            Object success = row.get("success");
            assertThat(success).isIn(true, Boolean.TRUE, 1, (byte) 1);
        });
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
