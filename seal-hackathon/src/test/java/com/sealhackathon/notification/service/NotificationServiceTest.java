package com.sealhackathon.notification.service;

import com.sealhackathon.notification.domain.Notification;
import com.sealhackathon.notification.domain.NotificationRecipient;
import com.sealhackathon.notification.domain.enums.NotificationChannel;
import com.sealhackathon.notification.domain.enums.NotificationType;
import com.sealhackathon.notification.repository.NotificationRecipientRepository;
import com.sealhackathon.notification.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationRecipientRepository recipientRepository;

    @InjectMocks private NotificationService notificationService;

    @Test
    void createNotification_shouldCreateBothChannels_perRecipient() {
        UUID userId = UUID.randomUUID();

        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> {
            Notification n = i.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        Notification result = notificationService.createNotification(
                NotificationType.ACCOUNT_APPROVED,
                "Account Approved",
                "Your account has been approved.",
                userId, "User",
                List.of(userId));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(NotificationType.ACCOUNT_APPROVED);
        assertThat(saved.getRecipients()).hasSize(2);

        long inAppCount = saved.getRecipients().stream()
                .filter(r -> r.getChannel() == NotificationChannel.IN_APP).count();
        long emailCount = saved.getRecipients().stream()
                .filter(r -> r.getChannel() == NotificationChannel.EMAIL).count();

        assertThat(inAppCount).isEqualTo(1);
        assertThat(emailCount).isEqualTo(1);
    }

    @Test
    void createNotification_shouldHandleMultipleRecipients() {
        UUID user1 = UUID.randomUUID();
        UUID user2 = UUID.randomUUID();

        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> {
            Notification n = i.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        notificationService.createNotification(
                NotificationType.RESULTS_PUBLISHED,
                "Results Published",
                "Check your ranking.",
                UUID.randomUUID(), "Round",
                List.of(user1, user2));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        assertThat(captor.getValue().getRecipients()).hasSize(4);
    }

    @Test
    void countUnread_shouldDelegateToRepository() {
        UUID userId = UUID.randomUUID();
        when(recipientRepository.countByUserIdAndChannelAndReadAtIsNull(
                userId, NotificationChannel.IN_APP)).thenReturn(5L);

        long count = notificationService.countUnread(userId);

        assertThat(count).isEqualTo(5);
    }
}
