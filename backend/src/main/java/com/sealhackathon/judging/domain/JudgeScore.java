package com.sealhackathon.judging.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate Root — Judging Context.
 *
 * BR-34  Judge cannot score a team they mentor (conflict of interest).
 * BR-37  2-hour scoring timer per submission (startedAt + 2h).
 * BR-39  Judge can update scores before scoringDeadline.
 * BR-40  Scores locked (LOCKED) after scoringDeadline.
 * BR-41  Every score create/update/delete is audit-logged.
 * BR-43  Coordinator can re-open scoring → status reverts to IN_PROGRESS.
 *
 * One JudgeScore per (judge, submission).
 * References User (judge), Submission, and Round by ID — cross-module.
 */
@Entity
@Table(name = "judge_scores", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"judge_user_id", "submission_id"})
}, indexes = {
        @Index(name = "idx_judge_score_round_id", columnList = "round_id"),
        @Index(name = "idx_judge_score_submission_id", columnList = "submission_id"),
        @Index(name = "idx_judge_score_judge_user_id", columnList = "judge_user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JudgeScore extends BaseEntity {

    // ── Cross-module reference to User (judge) ──
    @NotNull
    @Column(name = "judge_user_id", nullable = false)
    private UUID judgeUserId;

    // ── Cross-module reference to Submission ──
    @NotNull
    @Column(name = "submission_id", nullable = false)
    private UUID submissionId;

    // ── Cross-module reference to Round ──
    @NotNull
    @Column(name = "round_id", nullable = false)
    private UUID roundId;

    // ── BR-37, BR-40, BR-43 ──
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ScoreStatus status = ScoreStatus.IN_PROGRESS;

    // ── BR-37: scoring timer starts here ──
    @NotNull
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Version
    @Column(name = "version")
    private Long version;

    // ── Child: one detail per criteria ──
    @OneToMany(mappedBy = "judgeScore", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<JudgeScoreDetail> details = new ArrayList<>();

    // ── Child: comments (mandatory for extreme scores) ──
    @OneToMany(mappedBy = "judgeScore", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<JudgeComment> comments = new ArrayList<>();
}
