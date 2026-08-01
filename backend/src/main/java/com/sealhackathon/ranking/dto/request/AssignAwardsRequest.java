package com.sealhackathon.ranking.dto.request;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignAwardsRequest {

    @Valid
    @Builder.Default
    private List<ManualPrizeAssignmentRequest> manualAssignments = new ArrayList<>();
}
