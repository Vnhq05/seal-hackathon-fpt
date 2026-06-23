package com.sealhackathon.user.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Aggregate Root — Identity & Access Context.
 *
 * BR-01  Participant self-register → Pending → Admin approve/reject
 * BR-02  Internal roles created only by System Admin
 * BR-03  Email regex, password ≥ 6 chars, FPT studentId = SE + 6 digits
 * BR-04  Email unique system-wide (including Pending/Rejected)
 * BR-05  Only Active accounts can login
 * BR-06  Lock after 5 failed attempts in 15 min → locked 15 min
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    // ── BR-04: unique index, used as login identifier ──
    @NotBlank
    @Email
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    // ── BR-03: password ≥ 6 characters (validated on input, stored as hash) ──
    @NotBlank
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @NotBlank
    @Size(max = 255)
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Size(max = 20)
    @Column(name = "phone")
    private String phone;

    // ── BR-03: FPT_STUDENT → required, regex SE[0-9]{6}
    //           EXTERNAL_STUDENT → required, free-form
    //           Internal roles → nullable ──
    @Size(max = 20)
    @Column(name = "student_id")
    private String studentId;

    // ── BR-03: EXTERNAL_STUDENT → required
    //           others → nullable ──
    @Size(max = 255)
    @Column(name = "university_name")
    private String universityName;

    // ── BR-01, BR-02: determines registration path and RBAC ──
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false)
    private UserType userType;

    // ── BR-01: Pending → Active (approved) or Rejected
    //    BR-06: Active → Locked (temporary) ──
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private AccountStatus status = AccountStatus.PENDING;

    // ── BR-06: counter for consecutive failed logins within 15-min window ──
    @Column(name = "failed_login_attempts", nullable = false)
    @Builder.Default
    private int failedLoginAttempts = 0;

    // ── BR-06: null when not locked; set to now + 15 min on 5th failure ──
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "semester")
    private Integer semester;
}
