package com.sealhackathon.notification.repository;

import com.sealhackathon.notification.domain.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("SELECT n FROM Notification n JOIN n.recipients r WHERE r.userId = :userId ORDER BY n.createdAt DESC")
    Page<Notification> findByRecipientUserId(@Param("userId") UUID userId, Pageable pageable);
}
