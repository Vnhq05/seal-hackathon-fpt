package com.sealhackathon.judging.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Child entity of JudgeScore aggregate.
 * One row per (judge-score, criteria) — the actual numeric score.
 *
 * BR-35  Score range 0–10 per criteria.
 * BR-36  Comment required when score < 3 or > 8 (enforced at service
 *        layer by checking corresponding JudgeComment).
 *
 * References Criteria by ID — cross-module (criteria owned by event module).
 */
@Entity
@Table(name = "judge_score_details", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"judge_score_id", "criteria_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JudgeScoreDetail extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "judge_score_id", nullable = false)
    private JudgeScore judgeScore;

    // ── Cross-module reference to Criteria (event module) ──
    @NotNull
    @Column(name = "criteria_id", nullable = false)
    private UUID criteriaId;

    // ── BR-35: integer score [0, 10] ──
    @NotNull
    @Min(0)
    @Max(10)
    @Column(name = "score", nullable = false)
    private Integer score;
}
