package com.sealhackathon.submission.dto.request;

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

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubmissionRequest {

    @NotBlank(message = "GitHub URL is required")
    @Size(max = 500)
    private String githubUrl;

    @NotBlank(message = "Demo URL is required")
    @Size(max = 500)
    private String demoUrl;

    @NotNull(message = "PDF page count is required")
    @Min(value = 1, message = "PDF must have at least 1 page")
    @Max(value = 2, message = "PDF must not exceed 2 pages")
    private Integer pdfPageCount;
}
