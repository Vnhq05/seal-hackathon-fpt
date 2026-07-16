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
 * Regression guard for N1: an SMTP outage must not destroy the in-app notification.
 *
 * This began as a probe and ran RED on CI, confirming the bug: EmailService.sendEmailsForNotification
 * was @Transactional and shared its transaction with NotificationService.createNotification, so a mail
 * failure marked that transaction rollback-only and the notification was lost with the mail it had
 * nothing to do with. Dropping the @Transactional boundary (the mail exception now propagates to
 * notify()'s catch instead of being turned into rollback-only) is the fix this test now protects.
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
