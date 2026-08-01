package com.sealhackathon.ranking.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualPrizeAssignmentRequest {

    @NotNull
    private UUID prizeId;

    @NotNull
    private UUID teamId;
}
