package com.sealhackathon.event.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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

    /** Null = unlimited capacity (coordinator assigns teams). */
    @Min(value = 1, message = "Max teams must be at least 1")
    private Integer maxTeams;

    private UUID scoringTemplateId;
}
