package com.sealhackathon.submission.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubmissionRequest {

    /** @deprecated Use {@link #sourceCodeUrl}. Accepted for backward compatibility. */
    @Size(max = 500)
    private String githubUrl;

    /** Canonical source code URL (GitHub, Jira, Confluence, Notion). */
    @Size(max = 500)
    private String sourceCodeUrl;

    @Size(max = 500)
    private String slideUrl;

    @Size(max = 500)
    private String demoUrl;

    /** Optional — for non-SEAL first submit when PDF is uploaded. */
    @Min(value = 1, message = "PDF must have at least 1 page")
    @Max(value = 50, message = "PDF page count is invalid")
    private Integer pdfPageCount;
}
