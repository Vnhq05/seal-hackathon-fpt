package com.sealhackathon.listener;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.event.event.EventCreatedEvent;
import com.sealhackathon.event.event.ScoringWindowReopenedEvent;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.event.AccountApprovedEvent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * B1 — probe only. Proves whether AFTER_COMMIT listeners persist their writes.
 *
 * MUST NOT be annotated @Transactional: the probes rely on a real commit so that
 * TransactionPhase.AFTER_COMMIT actually fires. All reads go through JdbcTemplate
 * outside any transaction, so a green assertion means the row is really committed,
 * not merely sitting in a persistence context.
 */
class TransactionalListenerPersistenceIntegrationTest extends BaseIntegrationTest {

    private static final UUID SYSTEM_ACTOR = UUID.fromString("00000000-0000-0000-0000-000000000000");

    @Autowired private ApplicationEventPublisher publisher;
    @Autowired private TransactionTemplate txTemplate;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private AuditService auditService;

    // ── CONTROL: must be GREEN. If this is red, the write path itself is broken
    //    and every probe below is meaningless.
    @Test
    void control_auditService_persists_whenCalledInsideLiveTransaction() {
        UUID targetId = UUID.randomUUID();

        txTemplate.executeWithoutResult(status ->
                auditService.log(SYSTEM_ACTOR, "EVENT_CREATED", targetId, "HackathonEvent",
                        null, "{\"name\":\"control\"}", null));

        entityManager.clear();
        assertThat(countAudit("EVENT_CREATED", targetId))
                .as("control: auditService.log inside a live tx must commit")
                .isEqualTo(1);
    }

    // ── PROBE 1: AuditEventListener (36 handlers) via persist()
    @Test
    void probe_auditListener_persists_whenEventPublishedInTransaction() {
        UUID eventId = UUID.randomUUID();

        txTemplate.executeWithoutResult(status ->
                publisher.publishEvent(new EventCreatedEvent(
                        eventId, "AFTER_COMMIT probe", UUID.randomUUID().toString())));

        entityManager.clear();
        assertThat(countAudit("EVENT_CREATED", eventId))
                .as("AuditEventListener.onEventCreated runs in AFTER_COMMIT")
                .isEqualTo(1);
    }

    // ── PROBE 2: NotificationEventListener (20 handlers) via persist()
    @Test
    void probe_notificationListener_persists_whenEventPublishedInTransaction() {
        User user = createStudent();

        txTemplate.executeWithoutResult(status ->
                publisher.publishEvent(new AccountApprovedEvent(
                        user.getId(), user.getEmail(), user.getFullName())));

        entityManager.clear();
        Integer rows = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE type = 'ACCOUNT_APPROVED' AND reference_id = ?",
                Integer.class, user.getId());
        assertThat(rows)
                .as("NotificationEventListener.onAccountApproved runs in AFTER_COMMIT")
                .isEqualTo(1);
    }

    // ── PROBE 3: JudgingEventListener (1 handler) via bulk @Modifying UPDATE.
    //    Different write mechanism from the two probes above — may fail differently.
    @Test
    void probe_judgingListener_bulkUpdateApplies_whenEventPublishedInTransaction() {
        UUID roundId = UUID.randomUUID();
        UUID scoreId = insertJudgeScore(roundId, "LOCKED");

        txTemplate.executeWithoutResult(status ->
                publisher.publishEvent(new ScoringWindowReopenedEvent(
                        roundId, LocalDateTime.now().plusDays(1))));

        entityManager.clear();
        String status = jdbc.queryForObject(
                "SELECT status FROM judge_scores WHERE id = ?", String.class, scoreId);
        assertThat(status)
                .as("JudgingEventListener flips LOCKED -> COMPLETED in AFTER_COMMIT")
                .isEqualTo("COMPLETED");
    }

    private Integer countAudit(String action, UUID targetId) {
        return jdbc.queryForObject(
                "SELECT COUNT(*) FROM audit_logs WHERE action = ? AND target_id = ?",
                Integer.class, action, targetId);
    }

    /** judge_scores has no FKs (see E4), so random UUIDs for judge/submission are fine. */
    private UUID insertJudgeScore(UUID roundId, String status) {
        UUID id = UUID.randomUUID();
        jdbc.update(
                "INSERT INTO judge_scores "
                        + "(id, created_at, judge_user_id, submission_id, round_id, status, started_at, version) "
                        + "VALUES (?, SYSUTCDATETIME(), ?, ?, ?, ?, SYSUTCDATETIME(), 0)",
                id, UUID.randomUUID(), UUID.randomUUID(), roundId, status);
        return id;
    }
}
