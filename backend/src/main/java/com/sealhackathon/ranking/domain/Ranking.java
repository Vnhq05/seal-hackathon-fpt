package com.sealhackathon.ranking.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Aggregate Root — Ranking & Results Context.
 * Versioned snapshot: each recalculation creates a new version.
 *
 * BR-44  finalScore = Σ(mean_criteria_i × weight_i).
 *        Default: Technical 40% + Innovation 30% + Presentation 20% + Feasibility 10%.
 * BR-45  Per (submission, criteria): mean of all judge scores.
 * BR-46  Trimmed mean when ≥ 5 judges (drop highest + lowest).
 * BR-47  Tie-break: Technical → Innovation → Presentation → submittedAt.
 * BR-48  Auto recalculate on score create/update/delete.
 *
 * References Team and Round by ID — cross-module.
 */
@Entity
@Table(name = "rankings", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"team_id", "round_id", "version"})
}, indexes = {
        @Index(name = "idx_ranking_round_id", columnList = "round_id"),
        @Index(name = "idx_ranking_team_id", columnList = "team_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ranking extends BaseEntity {

    // ── Cross-module reference to Team ──
    @NotNull
    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    // ── Cross-module reference to Round ──
    @NotNull
    @Column(name = "round_id", nullable = false)
    private UUID roundId;

    // ── BR-44: computed final score (precision 5, scale 2 → max 999.99) ──
    @NotNull
    @Column(name = "final_score", nullable = false, precision = 7, scale = 4)
    private BigDecimal finalScore;

    // ── Position in the ranking for this round ──
    @NotNull
    @Min(1)
    @Column(name = "rank", nullable = false)
    private Integer rank;

    // ── BR-48: incremented on each recalculation ──
    @NotNull
    @Min(1)
    @Column(name = "version", nullable = false)
    private Integer version;

    @NotNull
    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;
}
