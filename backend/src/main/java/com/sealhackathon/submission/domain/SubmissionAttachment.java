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
 * Child entity of SubmissionVersion — arbitrary file under the Other submission part.
 * Max size 25 MB; no MIME / page-count restriction.
 */
@Entity
@Table(name = "submission_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionAttachment extends BaseEntity {

    public static final long MAX_FILE_SIZE_BYTES = 26_214_400L;

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

    @NotNull
    @Min(1)
    @Max(MAX_FILE_SIZE_BYTES)
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /** Optional; only meaningful for legacy PDF uploads. */
    @Column(name = "page_count")
    private Integer pageCount;

    @Size(max = 255)
    @Column(name = "content_type")
    private String contentType;
}
