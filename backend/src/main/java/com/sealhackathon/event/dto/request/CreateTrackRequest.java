package com.sealhackathon.event.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTrackRequest {

    @NotBlank(message = "Track name is required")
    @Size(max = 255)
    private String name;

    @Size(max = 1000)
    private String description;

    @Size(max = 1000)
    private String topic;

    @NotNull(message = "Max teams is required")
    @Min(value = 16, message = "Max teams must be at least 16")
    @jakarta.validation.constraints.Max(value = 40, message = "Max teams must be at most 40")
    private Integer maxTeams;

    private UUID scoringTemplateId;
}
