package com.sealhackathon.event.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateCompetitionGroupsRequest {

    /** Target teams per group — used to compute group count: G = ceil(N / teamsPerGroup). */
    @NotNull
    @Min(value = 1, message = "Teams per group must be at least 1")
    @Max(value = 100, message = "Teams per group must be at most 100")
    private Integer teamsPerGroup;
}
