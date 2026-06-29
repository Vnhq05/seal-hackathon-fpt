package com.sealhackathon.ranking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalistSelectResultResponse {

    private List<FinalistResponse> finalists;
    private List<ContestedSlotResponse> contestedSlots;
    private FinalistSelectionSummaryResponse summary;
}
