package com.sealhackathon.judging.dto.response;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.judging.domain.enums.ScoreAdjustmentType;
import com.sealhackathon.judging.domain.enums.ScoreReviewStatus;
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
public class ScoreReviewContextResponse {

    private UUID reviewId;
    private UUID submissionId;
    private ScoreReviewStatus status;
    private ScoreAdjustmentType adjustmentType;
    private BigDecimal deviationValue;
    private int deviationThreshold;
    private Integer scoreScaleMax;
    private BigDecimal consensusIndex;
    private double cohenDThreshold;
    private boolean canRequestAdjustment;
    private boolean canEditForAdjustment;
    private String requestNote;
    private String resolutionNote;
    private UUID resolvedBy;
    private UserType resolvedByRole;
    private String resolvedByFullName;
}
