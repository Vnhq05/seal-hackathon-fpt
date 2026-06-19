package com.sealhackathon.judging.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreSubmissionRequest {

    @NotNull(message = "Submission ID is required")
    private UUID submissionId;

    @NotEmpty(message = "At least one score detail is required")
    @Valid
    private List<ScoreDetailDto> scores;
}
