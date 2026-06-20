package com.sealhackathon.judging.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Child entity of JudgeScore aggregate.
 * One comment per (judge-score, criteria).
 *
 * BR-36  Comment is mandatory when the corresponding JudgeScoreDetail.score
 *        is < 50 or > 90. Optional otherwise.
 *        Enforced at service layer before persisting the JudgeScore aggregate.
 *
 * References Criteria by ID — cross-module.
 */
@Entity
@Table(name = "judge_comments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"judge_score_id", "criteria_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JudgeComment extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "judge_score_id", nullable = false)
    private JudgeScore judgeScore;

    // ── Cross-module reference to Criteria (event module) ──
    @NotNull
    @Column(name = "criteria_id", nullable = false)
    private UUID criteriaId;

    @NotBlank
    @Size(max = 2000)
    @Column(name = "comment", nullable = false)
    private String comment;
}
