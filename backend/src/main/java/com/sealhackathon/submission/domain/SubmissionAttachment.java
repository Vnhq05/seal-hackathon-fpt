package com.sealhackathon.submission.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Child entity of SubmissionVersion.
 *
 * BR-26  PDF file size ≤ 5 MB (5_242_880 bytes).
 * BR-27  PDF page count ≤ 2 pages.
 *
 * Validated by PdfValidator before persistence.
 */
@Entity
@Table(name = "submission_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionAttachment extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_version_id", nullable = false)
    private SubmissionVersion submissionVersion;

    @NotBlank
    @Size(max = 255)
    @Column(name = "file_name", nullable = false)
    private String fileName;

    @NotBlank
    @Size(max = 500)
    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    // ── BR-26: max 5 MB ──
    @NotNull
    @Min(1)
    @Max(5_242_880)
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    // ── BR-27: max 2 pages ──
    @NotNull
    @Min(1)
    @Max(2)
    @Column(name = "page_count", nullable = false)
    private Integer pageCount;
}
