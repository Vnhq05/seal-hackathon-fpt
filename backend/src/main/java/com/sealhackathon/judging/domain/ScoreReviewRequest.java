package com.sealhackathon.judging.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.judging.domain.enums.ScoreReviewStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "score_review_requests", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"submission_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoreReviewRequest extends BaseEntity {

    @NotNull
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @NotNull
    @Column(name = "round_id", nullable = false)
    private UUID roundId;

    @NotNull
    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @NotNull
    @Column(name = "submission_id", nullable = false)
    private UUID submissionId;

    @NotNull
    @Column(name = "deviation_value", nullable = false, precision = 6, scale = 2)
    private BigDecimal deviationValue;

    @NotNull
    @Column(name = "min_judge_score", nullable = false, precision = 6, scale = 2)
    private BigDecimal minJudgeScore;

    @NotNull
    @Column(name = "max_judge_score", nullable = false, precision = 6, scale = 2)
    private BigDecimal maxJudgeScore;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ScoreReviewStatus status = ScoreReviewStatus.OPEN;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolved_by")
    private UUID resolvedBy;

    @Size(max = 2000)
    @Column(name = "resolution_note")
    private String resolutionNote;
}
