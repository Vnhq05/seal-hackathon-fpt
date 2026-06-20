package com.sealhackathon.submission.dto.response;

import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResponse {

    private UUID id;
    private UUID teamId;
    private UUID roundId;
    private SubmissionStatus status;
    private UUID submittedBy;
    private int currentVersion;
    private int totalVersions;
    private SubmissionVersionResponse latestVersion;
    private LocalDateTime createdAt;
}
