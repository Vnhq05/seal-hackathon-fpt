package com.sealhackathon.notification.listener;

import com.sealhackathon.event.event.JudgeAssignedEvent;
import com.sealhackathon.notification.domain.Notification;
import com.sealhackathon.notification.domain.enums.NotificationType;
import com.sealhackathon.notification.service.EmailService;
import com.sealhackathon.notification.service.NotificationService;
import com.sealhackathon.ranking.event.ResultsPublishedEvent;
import com.sealhackathon.user.event.AccountApprovedEvent;
import com.sealhackathon.user.event.AccountRejectedEvent;
import com.sealhackathon.user.service.UserPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationEventListenerTest {

    @Mock private NotificationService notificationService;
    @Mock private EmailService emailService;
    @Mock private UserPublicService userPublicService;

    @InjectMocks private NotificationEventListener listener;

    @Test
    void onAccountApproved_shouldCreateNotification() {
        UUID userId = UUID.randomUUID();
        Notification mockNotif = Notification.builder().build();
        mockNotif.setId(UUID.randomUUID());

        when(notificationService.createNotification(
                eq(NotificationType.ACCOUNT_APPROVED), anyString(), anyString(),
                eq(userId), eq("User"), eq(List.of(userId))))
                .thenReturn(mockNotif);

        listener.onAccountApproved(new AccountApprovedEvent(userId, "test@test.com", "Test"));

        verify(notificationService).createNotification(
                eq(NotificationType.ACCOUNT_APPROVED),
                eq("Account Approved"),
                anyString(),
                eq(userId), eq("User"), eq(List.of(userId)));
        verify(emailService).sendEmailsForNotification(mockNotif);
    }

    @Test
    void onAccountRejected_shouldIncludeReason() {
        UUID userId = UUID.randomUUID();
        Notification mockNotif = Notification.builder().build();
        mockNotif.setId(UUID.randomUUID());

        when(notificationService.createNotification(
                any(), anyString(), anyString(), any(), anyString(), anyList()))
                .thenReturn(mockNotif);

        listener.onAccountRejected(new AccountRejectedEvent(userId, "r@t.com", "Invalid ID"));

        ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
        verify(notificationService).createNotification(
                eq(NotificationType.ACCOUNT_REJECTED),
                anyString(), messageCaptor.capture(),
                any(), anyString(), anyList());

        assertThat(messageCaptor.getValue()).contains("Invalid ID");
    }

    @Test
    void onJudgeAssigned_shouldNotifyJudge() {
        UUID judgeId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        Notification mockNotif = Notification.builder().build();
        mockNotif.setId(UUID.randomUUID());

        when(notificationService.createNotification(
                any(), anyString(), anyString(), any(), anyString(), anyList()))
                .thenReturn(mockNotif);

        listener.onJudgeAssigned(new JudgeAssignedEvent(
                UUID.randomUUID(), judgeId, roundId, eventId));

        verify(notificationService).createNotification(
                eq(NotificationType.JUDGE_ASSIGNED),
                anyString(), anyString(),
                eq(roundId), eq("Round"), eq(List.of(judgeId)));
    }

    @Test
    void onResultsPublished_shouldSkip_whenNoRecipients() {
        listener.onResultsPublished(new ResultsPublishedEvent(
                UUID.randomUUID(), UUID.randomUUID(),
                LocalDateTime.now(), LocalDateTime.now().plusHours(24)));
    }
}
