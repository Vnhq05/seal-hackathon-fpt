package com.seal.seal_hackathon_fpt.features.judging.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "judges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Judge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
        NULL nếu là guest judge ngoài hệ thống
     */
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "is_guest", nullable = false)
    private Boolean isGuest;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Không lưu DB — trả kèm email (từ bảng users) để hiển thị/tìm kiếm judge.
    @Transient
    private String email;
}