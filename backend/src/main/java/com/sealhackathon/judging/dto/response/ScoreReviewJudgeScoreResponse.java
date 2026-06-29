package com.sealhackathon.judging.dto.response;

import com.sealhackathon.judging.domain.enums.ScoreStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreReviewJudgeScoreResponse {

    private UUID judgeUserId;
    private String judgeFullName;
    private BigDecimal weightedScore;
    private BigDecimal percentScore;
    private ScoreStatus status;
}
