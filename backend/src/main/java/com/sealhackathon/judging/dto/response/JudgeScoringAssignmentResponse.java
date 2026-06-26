package com.sealhackathon.judging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JudgeScoringAssignmentResponse {

    private UUID teamId;
    private String teamName;
    private UUID roundId;
    private String roundName;
    private UUID eventId;
    private String eventName;
    private UUID trackId;
    private String trackName;
    private UUID submissionId;
    private String scoringStatus;
    private LocalDateTime scoringDeadline;
}
