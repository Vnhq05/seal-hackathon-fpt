package com.sealhackathon.submission.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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
 * BR-25  Three components: githubUrl + demoUrl + PDF attachment.
 * BR-28  demoUrl must match whitelist (YouTube, Vimeo, etc.).
 * BR-29  githubUrl must be a valid GitHub repository URL.
 * BR-30  Every re-submission creates a new version; old versions retained.
 * BR-47  submittedAt used as final tie-breaker in ranking.
 */
@Entity
@Table(name = "submission_versions")
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

    // ── BR-29: validated by GitHubUrlValidator ──
    @NotBlank
    @Size(max = 500)
    @Column(name = "github_url", nullable = false)
    private String githubUrl;

    @Size(max = 500)
    @Column(name = "slide_url")
    private String slideUrl;

    // ── BR-28: validated against domain whitelist ──
    @NotBlank
    @Size(max = 500)
    @Column(name = "demo_url", nullable = false)
    private String demoUrl;

    // ── BR-47: tie-breaker — earlier submission wins ──
    @NotNull
    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    // ── Child: PDF attachments for this version ──
    @OneToMany(mappedBy = "submissionVersion", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SubmissionAttachment> attachments = new ArrayList<>();
}
