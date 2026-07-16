package com.sealhackathon.db;

import com.sealhackathon.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Proves V10 (free-text columns to Unicode) and V11 (duplicate UNIQUE removal) actually ran on SQL
 * Server, the way SchemaIntegrityIntegrationTest proves the earlier migrations. Column types come
 * from INFORMATION_SCHEMA so a silent no-op would fail, and one column is round-tripped through the
 * database with Vietnamese text and the characters that break codepage storage.
 */
class UnicodeAndConstraintMigrationIntegrationTest extends BaseIntegrationTest {

    @Autowired private JdbcTemplate jdbc;

    private String columnType(String table, String column) {
        return jdbc.queryForObject(
                "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS "
                        + "WHERE TABLE_NAME = ? AND COLUMN_NAME = ?",
                String.class, table, column);
    }

    private Integer constraintCount(String name) {
        return jdbc.queryForObject(
                "SELECT COUNT(*) FROM sys.key_constraints WHERE name = ?", Integer.class, name);
    }

    @Test
    void v10_freeTextColumnsAreNvarchar() {
        // A representative spread: a plain column, one that needed MAX, and one behind a UNIQUE that
        // had to be dropped and recreated.
        assertThat(columnType("notifications", "message")).isEqualTo("nvarchar");
        assertThat(columnType("mentor_chat_messages", "message")).isEqualTo("nvarchar");
        assertThat(columnType("mentor_feedbacks", "content")).isEqualTo("nvarchar");
        assertThat(columnType("teams", "name")).isEqualTo("nvarchar");
        assertThat(columnType("hackathon_events", "name")).isEqualTo("nvarchar");
        assertThat(columnType("scoring_templates", "name")).isEqualTo("nvarchar");
    }

    @Test
    void v10_vietnameseRoundTripsThroughNotification() {
        String title = "Thông báo \"Đội Rồng\" \\ Huế";
        UUID id = UUID.randomUUID();

        jdbc.update("INSERT INTO notifications (id, created_at, message, title, type) "
                        + "VALUES (?, SYSUTCDATETIME(), ?, ?, N'TEAM_REGISTERED')",
                id, "nội dung", title);

        String stored = jdbc.queryForObject(
                "SELECT title FROM notifications WHERE id = ?", String.class, id);
        assertThat(stored)
                .as("nvarchar must round-trip the diacritics that varchar would strip")
                .isEqualTo(title);
    }

    @Test
    void v10_uniqueOnRecreatedNameStillRejectsDuplicates() {
        // teams UNIQUE(event_id, name) was dropped and recreated around the type change in V10; prove
        // it was actually put back, not lost.
        UUID eventId = UUID.randomUUID();
        UUID leaderId = createStudent().getId();
        String name = "Đội Trùng Tên";

        jdbc.update("INSERT INTO teams (id, created_at, event_id, leader_id, name, status, is_recruiting) "
                        + "VALUES (?, SYSUTCDATETIME(), ?, ?, ?, 'FORMING', 0)",
                UUID.randomUUID(), eventId, leaderId, name);

        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO teams (id, created_at, event_id, leader_id, name, status, is_recruiting) "
                        + "VALUES (?, SYSUTCDATETIME(), ?, ?, ?, 'FORMING', 0)",
                UUID.randomUUID(), eventId, leaderId, name))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void v11_duplicateUniqueConstraintsAreGone_originalsRemain() {
        assertThat(constraintCount("UKgd614s3awdkw2r75iikqkan0r")).isZero();
        assertThat(constraintCount("UK4b484bu8jyfdkjnl1w04w4ia9")).isZero();
        assertThat(constraintCount("UKa9mj81t7o38nsry31cnr32vqc")).isZero();
        assertThat(constraintCount("UK69oqex9b0mg7xd0vtipantt9g")).isZero();
        assertThat(constraintCount("UKnyaq1hmm0mcrmqmeqa62alwqu")).isZero();

        // The readable ones that were kept must survive.
        assertThat(constraintCount("uq_finalist_event_team")).isEqualTo(1);
        assertThat(constraintCount("uq_draw_queue_session_team")).isEqualTo(1);
        assertThat(constraintCount("uq_draw_queue_session_order")).isEqualTo(1);
    }

    @Test
    void v13_teamAwardsDuplicateUniqueIsGone_originalRemains() {
        assertThat(constraintCount("UKpjyb6tp2bup52n3kdss4mg94a")).isZero();
        assertThat(constraintCount("uq_team_award_event_team")).isEqualTo(1);
    }

    @Test
    void v14_hotPathIndexesExist() {
        assertThat(indexExists("idx_mentor_chat_team_sent")).isTrue();
        assertThat(indexExists("idx_ranking_round_version_rank")).isTrue();
        assertThat(indexExists("idx_notif_recipient_user_channel_read")).isTrue();
    }

    private boolean indexExists(String name) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM sys.indexes WHERE name = ?", Integer.class, name);
        return n != null && n > 0;
    }
}
