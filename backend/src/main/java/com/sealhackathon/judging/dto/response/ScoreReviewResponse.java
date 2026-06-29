package com.sealhackathon.judging.dto.response;

import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.judging.domain.enums.ScoreReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreReviewResponse {

    private UUID id;
    private UUID eventId;
    private UUID roundId;
    private RoundType roundType;
    private UUID teamId;
    private String teamName;
    private UUID submissionId;
    private BigDecimal deviationValue;
    private BigDecimal minJudgeScore;
    private BigDecimal maxJudgeScore;
    private ScoreReviewStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private String resolutionNote;
    private List<ScoreReviewJudgeScoreResponse> judgeScores;
}
