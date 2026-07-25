package com.sealhackathon.submission.dto.request;

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

    /** Optional Other-section URL (any http/https link). */
    @Size(max = 500)
    private String otherUrl;

    /**
     * @deprecated Prefer {@link #otherUrl}. Still accepted and coalesced into Other.
     */
    @Size(max = 500)
    private String demoUrl;

    /** @deprecated Page count no longer required for Other files. */
    private Integer pdfPageCount;
}
