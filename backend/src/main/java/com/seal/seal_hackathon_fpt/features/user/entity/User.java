package com.seal.seal_hackathon_fpt.features.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Đã map đúng vào cột full_name trong DB
    @Column(name = "full_name", nullable = false, length = 150)
    private String full_name;

    @Column(nullable = false, unique = true, length = 190)
    private String email;

    // Đã map đúng vào cột password_hash trong DB
    @Column(name = "password_hash", nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    // Hai cột mới theo chuẩn thiết kế CSDL
    @Column(name = "student_id", length = 20)
    private String studentId;

    @Column(length = 150)
    private String school;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ==========================================
    // CÁC HÀM BẮT BUỘC CỦA SPRING SECURITY
    // ==========================================

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        // Tài khoản bị khóa nếu trạng thái là SUSPENDED
        return status != UserStatus.suspended;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        // Cho phép hoạt động nếu là ACTIVE (hoặc PENDING tùy yêu cầu nghiệp vụ của team bạn)
        return status == UserStatus.active || status == UserStatus.pending;
    }
}