package com.sealhackathon.judging.dto.request;

import com.sealhackathon.judging.domain.enums.ScoreReviewStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResolveScoreReviewRequest {

    @NotNull
    private ScoreReviewStatus status;

    @Size(max = 2000)
    private String resolutionNote;
}
