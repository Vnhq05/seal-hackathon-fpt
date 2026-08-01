package com.sealhackathon.ranking.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignAwardsRequest {

    /** Manual prize → team mappings for MANUAL (special) prizes. */
    @Valid
    @Builder.Default
    private List<ManualPrizeAssignment> manualAssignments = new ArrayList<>();

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManualPrizeAssignment {
        @NotNull
        private UUID prizeId;
        @NotNull
        private UUID teamId;
    }
    @Valid
    @Builder.Default
    private List<ManualPrizeAssignmentRequest> manualAssignments = new ArrayList<>();
}
