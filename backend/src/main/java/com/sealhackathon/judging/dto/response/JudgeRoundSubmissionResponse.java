package com.sealhackathon.judging.dto.response;

import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JudgeRoundSubmissionResponse {

    private UUID submissionId;
    private UUID teamId;
    private String teamName;
    private UUID trackId;
    private String trackName;
    private UUID groupId;
    private String groupName;
    private LocalDateTime submittedAt;
    private LocalDateTime scoringDeadline;
    private SubmissionStatus submissionStatus;
    private String scoringStatus;
    private BigDecimal weightedScore;
    private BigDecimal maxWeightedScore;
    private boolean conflictOfInterest;
    private String conflictReason;
    private boolean scoringAllowed;
    private String scoringDeniedReason;
}
