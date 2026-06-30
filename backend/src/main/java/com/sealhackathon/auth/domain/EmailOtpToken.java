package com.sealhackathon.auth.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One-time 6-digit OTP for email verification during participant registration.
 * TTL and resend cooldown are configured via app.otp.* properties.
 *
 * References User by ID (cross-module — no JPA relationship).
 */
@Entity
@Table(name = "email_otp_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailOtpToken extends BaseEntity {

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotBlank
    @Column(name = "code", nullable = false, length = 6)
    private String code;

    @NotNull
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @NotNull
    @Column(name = "resend_allowed_at", nullable = false)
    private LocalDateTime resendAllowedAt;

    @Column(name = "used", nullable = false)
    @Builder.Default
    private boolean used = false;
}
