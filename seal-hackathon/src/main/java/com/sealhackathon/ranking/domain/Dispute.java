package com.sealhackathon.ranking.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.ranking.domain.enums.DisputeStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * BR-56  Team leader may file a dispute within 24 hours of publish.
 *        After 24h, results become final.
 *        Dispute triggers a Coordinator/Admin review workflow
 *        with its own audit trail.
 *
 * References Team, Round, and User (filer/resolver) by ID — cross-module.
 */
@Entity
@Table(name = "disputes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispute extends BaseEntity {

    @NotNull
    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @NotNull
    @Column(name = "round_id", nullable = false)
    private UUID roundId;

    // ── Cross-module reference to User (team leader) ──
    @NotNull
    @Column(name = "filed_by", nullable = false)
    private UUID filedBy;

    @NotBlank
    @Size(max = 2000)
    @Column(name = "reason", nullable = false)
    private String reason;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private DisputeStatus status = DisputeStatus.PENDING;

    @NotNull
    @Column(name = "filed_at", nullable = false)
    private LocalDateTime filedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // ── Cross-module reference to User (Coordinator/Admin) ──
    @Column(name = "resolved_by")
    private UUID resolvedBy;

    @Size(max = 2000)
    @Column(name = "resolution")
    private String resolution;
}
