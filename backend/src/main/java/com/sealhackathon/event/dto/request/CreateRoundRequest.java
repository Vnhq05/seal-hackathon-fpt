package com.sealhackathon.event.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoundRequest {

    @NotNull(message = "Round number is required")
    @Min(value = 1, message = "Round number must be at least 1")
    private Integer roundNumber;

    @NotBlank(message = "Round name is required")
    @Size(max = 255)
    private String name;

    @NotNull(message = "Start date is required")
    private LocalDateTime startDate;

    @NotNull(message = "End date is required")
    private LocalDateTime endDate;

    @NotNull(message = "Submission deadline is required")
    private LocalDateTime submissionDeadline;

    @NotNull(message = "Scoring deadline is required")
    private LocalDateTime scoringDeadline;

    @NotNull(message = "Advancement cutoff is required")
    @Min(value = 1, message = "Advancement cutoff must be at least 1")
    private Integer advancementCutoff;

    @Min(value = 1, message = "Round weight must be at least 1")
    private Integer roundWeight;
}
