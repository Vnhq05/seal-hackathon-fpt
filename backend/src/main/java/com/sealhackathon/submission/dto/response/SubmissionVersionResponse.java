package com.sealhackathon.submission.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionVersionResponse {

    private UUID id;
    private Integer versionNumber;
    private String githubUrl;
    private String demoUrl;
    private LocalDateTime submittedAt;
    private List<AttachmentResponse> attachments;
}
