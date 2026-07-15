package com.sealhackathon.team;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.user.domain.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

/**
 * Asserts Flyway V0/V1 filtered unique {@code uq_team_members_one_leader} is present
 * (would be missing under ddl-auto=create-drop / Postgres).
 */
class TeamMemberLeaderUniqueConstraintIT extends BaseIntegrationTest {

    @Autowired private JdbcTemplate jdbcTemplate;
    @PersistenceContext private EntityManager entityManager;

    @Test
    @Transactional
    void filteredUnique_rejectsSecondLeaderOnSameTeam() {
        User leader1 = createUser("l1@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);
        User leader2 = createUser("l2@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);
        UUID eventId = UUID.randomUUID();

        Team team = Team.builder()
                .eventId(eventId)
                .name("One Leader Team")
                .leaderId(leader1.getId())
                .status(TeamStatus.FORMING)
                .build();
        entityManager.persist(team);
        entityManager.flush();

        jdbcTemplate.update(
                "INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) "
                        + "VALUES (?, SYSUTCDATETIME(), SYSUTCDATETIME(), 'LEADER', ?, ?, ?)",
                UUID.randomUUID(), leader1.getId(), team.getId(), eventId);

        Throwable thrown = catchThrowable(() -> jdbcTemplate.update(
                "INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) "
                        + "VALUES (?, SYSUTCDATETIME(), SYSUTCDATETIME(), 'LEADER', ?, ?, ?)",
                UUID.randomUUID(), leader2.getId(), team.getId(), eventId));

        assertThat(thrown).isInstanceOf(DataIntegrityViolationException.class);
        assertThat(thrown.getMessage() + " / " + thrown.getCause())
                .containsIgnoringCase("uq_team_members_one_leader");
    }
}
