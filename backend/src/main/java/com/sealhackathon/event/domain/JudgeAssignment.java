package com.sealhackathon.event.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * BR-13  Judges are assigned per round, not event-wide.
 *        Notification sent on assignment.
 *
 * References User (judge) by ID — cross-module, no JPA relationship.
 */
@Entity
@Table(name = "judge_assignments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"round_id", "judge_user_id", "track_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JudgeAssignment extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false)
    private Round round;

    @NotNull
    @Column(name = "judge_user_id", nullable = false)
    private UUID judgeUserId;

    /** Null for FINAL round (judge covers all finalists); required for PRELIMINARY. */
    @Column(name = "track_id")
    private UUID trackId;

    @NotNull
    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;
}
