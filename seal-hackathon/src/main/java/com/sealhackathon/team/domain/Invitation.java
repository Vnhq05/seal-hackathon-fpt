package com.sealhackathon.team.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.team.domain.enums.InvitationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
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
 * Standalone entity within Team Management Context.
 *
 * BR-21  Team leader sends invitations; invitees accept or reject.
 *        Expires implicitly when team is full (5 members).
 *
 * References User (inviter) by ID — cross-module, no JPA relationship.
 */
@Entity
@Table(name = "invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invitation extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    // ── Cross-module reference to User (the leader who sent it) ──
    @NotNull
    @Column(name = "inviter_id", nullable = false)
    private UUID inviterId;

    @NotBlank
    @Email
    @Column(name = "invitee_email", nullable = false)
    private String inviteeEmail;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private InvitationStatus status = InvitationStatus.PENDING;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}
