package com.sealhackathon.ranking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalistSelectionSummaryResponse {

    private int selectedCount;
    private int targetCount;
    private boolean penaltyEvaluationRequired;
}
