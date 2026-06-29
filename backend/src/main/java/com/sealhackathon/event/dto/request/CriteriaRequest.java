package com.sealhackathon.event.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CriteriaRequest {

    @NotBlank(message = "Criteria name is required")
    @Size(max = 255)
    private String name;

    @Size(max = 1000)
    private String description;

    @NotNull(message = "Weight is required")
    @Min(value = 1, message = "Weight must be at least 1")
    @Max(value = 100, message = "Weight must be at most 100")
    private Integer weight;

    @Min(0)
    private Integer sortOrder;

    @Min(0)
    @Max(100)
    private Integer minScore;

    @Min(1)
    @Max(100)
    private Integer maxScore;
}
