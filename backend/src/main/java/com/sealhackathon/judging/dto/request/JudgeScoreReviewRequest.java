package com.sealhackathon.judging.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class JudgeScoreReviewRequest {

    @NotNull
    private UUID submissionId;

    @NotBlank
    @Size(min = 10, max = 1000)
    private String note;
}
