package com.sealhackathon.audit.listener;

import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.auth.event.LoginFailedEvent;
import com.sealhackathon.auth.event.UserLoggedInEvent;
import com.sealhackathon.judging.event.ScoreCreatedEvent;
import com.sealhackathon.ranking.event.ResultsPublishedEvent;
import com.sealhackathon.user.event.AccountApprovedEvent;
import com.sealhackathon.user.event.AccountRejectedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuditEventListenerTest {

    @Mock private AuditService auditService;

    @InjectMocks private AuditEventListener listener;

    @Test
    void onUserLoggedIn_shouldLogWithIpAddress() {
        UUID userId = UUID.randomUUID();
        listener.onUserLoggedIn(new UserLoggedInEvent(userId, "192.168.1.1", LocalDateTime.now()));

        verify(auditService).log(eq(userId), eq("USER_LOGGED_IN"),
                eq(userId), eq("User"), isNull(), isNull(), eq("192.168.1.1"));
    }

    @Test
    void onLoginFailed_shouldLogEmailAndAttemptCount() {
        listener.onLoginFailed(new LoginFailedEvent("bad@test.com", "10.0.0.1", 3, LocalDateTime.now()));

        verify(auditService).log(any(UUID.class), eq("LOGIN_FAILED"),
                isNull(), eq("User"), isNull(),
                contains("bad@test.com"), eq("10.0.0.1"));
    }

    @Test
    void onAccountApproved_shouldLogStatusChange() {
        UUID userId = UUID.randomUUID();
        listener.onAccountApproved(new AccountApprovedEvent(userId, "a@b.com", "User A"));

        verify(auditService).log(any(UUID.class), eq("ACCOUNT_APPROVED"),
                eq(userId), eq("User"),
                contains("PENDING"), contains("ACTIVE"), isNull());
    }

    @Test
    void onAccountRejected_shouldLogReasonInNewValue() {
        UUID userId = UUID.randomUUID();
        listener.onAccountRejected(new AccountRejectedEvent(userId, "a@b.com", "Invalid docs"));

        verify(auditService).log(any(UUID.class), eq("ACCOUNT_REJECTED"),
                eq(userId), eq("User"),
                any(), contains("Invalid docs"), isNull());
    }

    @Test
    void onScoreCreated_shouldLogJudgeAsActor() {
        UUID judgeId = UUID.randomUUID();
        UUID scoreId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();

        listener.onScoreCreated(new ScoreCreatedEvent(scoreId, judgeId, submissionId, roundId));

        verify(auditService).log(eq(judgeId), eq("SCORE_CREATED"),
                eq(scoreId), eq("JudgeScore"), isNull(), any(), isNull());
    }

    @Test
    void onResultsPublished_shouldLogPublisher() {
        UUID publisherId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();

        listener.onResultsPublished(new ResultsPublishedEvent(
                roundId, publisherId, now, now.plusHours(24)));

        verify(auditService).log(eq(publisherId), eq("RESULTS_PUBLISHED"),
                eq(roundId), eq("PublishedResult"), isNull(), any(), isNull());
    }
}
