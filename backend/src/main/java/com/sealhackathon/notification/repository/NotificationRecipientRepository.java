package com.sealhackathon.notification.repository;

import com.sealhackathon.notification.domain.NotificationRecipient;
import com.sealhackathon.notification.domain.enums.NotificationChannel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, UUID> {

    Page<NotificationRecipient> findByUserIdAndChannelOrderByNotificationCreatedAtDesc(
            UUID userId, NotificationChannel channel, Pageable pageable);

    Page<NotificationRecipient> findByUserIdAndChannelAndReadAtIsNullOrderByNotificationCreatedAtDesc(
            UUID userId, NotificationChannel channel, Pageable pageable);

    long countByUserIdAndChannelAndReadAtIsNull(UUID userId, NotificationChannel channel);

    @Modifying
    @Query("UPDATE NotificationRecipient r SET r.readAt = CURRENT_TIMESTAMP " +
            "WHERE r.userId = :userId AND r.channel = :channel AND r.readAt IS NULL")
    int markAllAsRead(@Param("userId") UUID userId, @Param("channel") NotificationChannel channel);
}
