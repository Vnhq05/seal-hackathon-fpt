package com.seal.seal_hackathon_fpt.notification.controller;

import com.seal.seal_hackathon_fpt.notification.entity.Notification;
import com.seal.seal_hackathon_fpt.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<Notification> createNotification(
            @RequestBody Notification notification
    ) {

        return ResponseEntity.ok(
                notificationService.createNotification(notification)
        );
    }

    // [SỬA ĐỔI - Tính năng: Xem thông báo của tài khoản đang đăng nhập]
    // Đã xóa: @GetMapping("/{userId}")
    // Đã thêm: @GetMapping("/me") và mock userId hiện tại là 1L (Sẽ thay thế khi có JWT)
    @GetMapping("/me")
    public ResponseEntity<List<Notification>> getMyNotifications() {
        Long currentUserId = 1L; // TODO: Lấy từ Spring Security Context
        return ResponseEntity.ok(
                notificationService.getMyNotifications(currentUserId)
        );
    }
}