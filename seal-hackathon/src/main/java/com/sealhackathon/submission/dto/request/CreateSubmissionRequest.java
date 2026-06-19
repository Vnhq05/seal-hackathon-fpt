package com.sealhackathon.submission.dto.request;

import jakarta.validation.constraints.NotBlank;
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

    @NotBlank(message = "Demo video URL is required")
    @Size(max = 500)
    private String demoUrl;

    private int pdfPageCount;
}
