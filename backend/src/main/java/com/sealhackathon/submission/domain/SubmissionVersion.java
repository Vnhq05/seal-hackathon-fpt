package com.sealhackathon.submission.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Child entity of Submission aggregate. Immutable once created.
 *
 * Artifacts: slideUrl, source code URL (githubUrl), otherUrl and/or generic attachments.
 * demoUrl retained for backward compatibility (treated as Other in progress).
 * BR-29  Source code URL validated by SourceCodeUrlValidator (GitHub, Jira, Notion, etc.).
 * BR-30  Every re-submission creates a new version; old versions retained.
 * BR-47  submittedAt used as final tie-breaker in ranking.
 */
@Entity
@Table(name = "submission_versions", uniqueConstraints = {
        @UniqueConstraint(name = "uq_submission_version_number", columnNames = {"submission_id", "version_number"})
}, indexes = {
        @Index(name = "idx_submission_versions_submission_id", columnList = "submission_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionVersion extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @NotNull
    @Min(1)
    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    // ── BR-29: validated by SourceCodeUrlValidator; nullable during SEAL Milestone 1 ──
    @Size(max = 500)
    @Column(name = "github_url")
    private String githubUrl;

    @Size(max = 500)
    @Column(name = "slide_url")
    private String slideUrl;

    /** @deprecated Prefer {@link #otherUrl}; kept for legacy rows / progress mapping. */
    @Size(max = 500)
    @Column(name = "demo_url")
    private String demoUrl;

    @Size(max = 500)
    @Column(name = "other_url")
    private String otherUrl;

    // ── BR-47: tie-breaker — earlier submission wins ──
    @NotNull
    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    // ── Child: Other-section file attachments for this version ──
    @OneToMany(mappedBy = "submissionVersion", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SubmissionAttachment> attachments = new ArrayList<>();
}
