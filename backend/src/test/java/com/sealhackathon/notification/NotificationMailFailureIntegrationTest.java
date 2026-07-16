package com.sealhackathon.notification;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.event.AccountApprovedEvent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * N1 — probe. Read from code, not yet measured; this is the measurement.
 *
 * EmailService.sendEmailsForNotification is @Transactional and runs on the same transaction as
 * NotificationService.createNotification, and NotificationEventListener.notify() swallows whatever
 * it throws. So an SMTP outage should mark that shared transaction rollback-only, the swallow should
 * hide it, and the commit should then blow up with UnexpectedRollbackException — taking the in-app
 * notification down with the mail, though the two have nothing to do with each other.
 *
 * This was unreachable until 7afc1c8: nothing on that path ever committed, so there was no commit to
 * fail. Every other test has GreenMail up, which hides it.
 */
class NotificationMailFailureIntegrationTest extends BaseIntegrationTest {

    @Autowired private ApplicationEventPublisher publisher;
    @Autowired private TransactionTemplate txTemplate;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void notification_shouldPersist_whenSmtpIsDown() {
        User user = createStudent();

        withMailServerDown(() ->
                txTemplate.executeWithoutResult(status ->
                        publisher.publishEvent(new AccountApprovedEvent(
                                user.getId(), user.getEmail(), user.getFullName()))));

        entityManager.clear();
        Integer rows = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE type = 'ACCOUNT_APPROVED' AND reference_id = ?",
                Integer.class, user.getId());

        assertThat(rows)
                .as("an unreachable mail relay must not destroy the in-app notification")
                .isEqualTo(1);
    }
}
