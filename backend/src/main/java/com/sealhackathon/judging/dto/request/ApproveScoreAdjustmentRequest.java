package com.sealhackathon.judging.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApproveScoreAdjustmentRequest {

    @Size(max = 2000)
    private String resolutionNote;
}
