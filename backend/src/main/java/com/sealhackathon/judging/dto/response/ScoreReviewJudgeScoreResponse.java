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
    /** Distance from highest judge percent on the event scale (0–100). */
    private BigDecimal gapFromMaxPct;
    /** Leave-one-out Cohen's d vs other judges' percent scores; null when undefined. */
    private BigDecimal cohenD;
    /** True when gapFromMaxPct &gt; deviation threshold or |cohenD| &gt;= cohen-d threshold. */
    private boolean flagged;
    private ScoreStatus status;
}
