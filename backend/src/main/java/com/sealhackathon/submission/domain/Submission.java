package com.sealhackathon.submission.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
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
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate Root — Submission Context.
 *
 * BR-25  Valid submission = GitHub URL + PDF + Demo video URL.
 * BR-30  Each re-submission creates a new SubmissionVersion (append-only).
 * BR-31  Only the team leader can create/update a submission.
 * BR-32  No submissions after the round's submission deadline.
 * BR-50  Pending/NOT_SCORED submissions excluded from ranking.
 *
 * One submission per (team, round).
 * References Team and Round by ID — cross-module, no JPA relationships.
 */
@Entity
@Table(name = "submissions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"team_id", "round_id"})
}, indexes = {
        @Index(name = "idx_submission_team_id", columnList = "team_id"),
        @Index(name = "idx_submission_round_id", columnList = "round_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission extends BaseEntity {

    // ── Cross-module reference to Team ──
    @NotNull
    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    // ── Cross-module reference to Round ──
    @NotNull
    @Column(name = "round_id", nullable = false)
    private UUID roundId;

    // ── Points to the latest version ──
    @Column(name = "current_version_id")
    private UUID currentVersionId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.DRAFT;

    // ── BR-31: cross-module ref to User (team leader) ──
    @NotNull
    @Column(name = "submitted_by", nullable = false)
    private UUID submittedBy;

    // ── Child: immutable version history ──
    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SubmissionVersion> versions = new ArrayList<>();
}
