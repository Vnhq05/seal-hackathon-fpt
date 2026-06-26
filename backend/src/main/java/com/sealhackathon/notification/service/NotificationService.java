package com.sealhackathon.notification.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.notification.domain.Notification;
import com.sealhackathon.notification.domain.NotificationRecipient;
import com.sealhackathon.notification.domain.enums.NotificationChannel;
import com.sealhackathon.notification.domain.enums.NotificationType;
import com.sealhackathon.notification.dto.response.NotificationResponse;
import com.sealhackathon.notification.repository.NotificationRecipientRepository;
import com.sealhackathon.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository recipientRepository;

    @Transactional
    public Notification createNotification(NotificationType type, String title, String message,
                                            UUID referenceId, String referenceType,
                                            List<UUID> recipientUserIds) {
        Notification notification = Notification.builder()
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();

        List<NotificationRecipient> recipients = recipientUserIds.stream()
                .flatMap(userId -> List.of(
                        NotificationRecipient.builder()
                                .notification(notification)
                                .userId(userId)
                                .channel(NotificationChannel.IN_APP)
                                .build(),
                        NotificationRecipient.builder()
                                .notification(notification)
                                .userId(userId)
                                .channel(NotificationChannel.EMAIL)
                                .build()
                ).stream())
                .toList();

        notification.setRecipients(new java.util.ArrayList<>(recipients));
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getInAppNotifications(UUID userId, Pageable pageable) {
        return recipientRepository
                .findByUserIdAndChannelOrderByNotificationCreatedAtDesc(
                        userId, NotificationChannel.IN_APP, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUnreadNotifications(UUID userId, Pageable pageable) {
        return recipientRepository
                .findByUserIdAndChannelAndReadAtIsNullOrderByNotificationCreatedAtDesc(
                        userId, NotificationChannel.IN_APP, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long countUnread(UUID userId) {
        return recipientRepository.countByUserIdAndChannelAndReadAtIsNull(
                userId, NotificationChannel.IN_APP);
    }

    @Transactional
    public void markAsRead(UUID recipientId, UUID currentUserId) {
        NotificationRecipient recipient = recipientRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "NotificationRecipient", "id", recipientId));
        if (!recipient.getUserId().equals(currentUserId)) {
            throw new BusinessException(
                    "You can only mark your own notifications as read",
                    HttpStatus.FORBIDDEN) {};
        }
        if (recipient.getReadAt() == null) {
            recipient.setReadAt(LocalDateTime.now());
            recipientRepository.save(recipient);
        }
    }

    @Transactional
    public int markAllAsRead(UUID userId) {
        return recipientRepository.markAllAsRead(userId, NotificationChannel.IN_APP);
    }

    private NotificationResponse toResponse(NotificationRecipient r) {
        Notification n = r.getNotification();
        return NotificationResponse.builder()
                .id(n.getId())
                .recipientId(r.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .read(r.getReadAt() != null)
                .readAt(r.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
