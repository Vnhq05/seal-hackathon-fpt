package com.sealhackathon.event.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateScoringTemplateRequest {

    @NotBlank(message = "Template name is required")
    @Size(max = 255)
    private String name;

    @Size(max = 1000)
    private String description;

    @NotEmpty(message = "At least one criterion is required")
    @Valid
    private List<CriterionRequest> criteria;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CriterionRequest {

        @NotBlank(message = "Criterion name is required")
        @Size(max = 255)
        private String name;

        @Size(max = 1000)
        private String description;

        @NotNull(message = "Weight is required")
        @Positive(message = "Weight must be a positive integer greater than 0")
        @Min(value = 1, message = "Weight must be at least 1")
        @Max(value = 100, message = "Weight must be at most 100")
        private Integer weight;

        @Min(0)
        private Integer sortOrder;
    }
}
