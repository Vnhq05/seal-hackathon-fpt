package com.sealhackathon.common.dto;

import jakarta.validation.constraints.Min;
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
public class SystemConfigRequest {

    @NotNull(message = "Minimum team members is required")
    @Min(value = 1, message = "Minimum team members must be at least 1")
    private Integer minTeamMembers;

    @NotNull(message = "Maximum team members is required")
    @Min(value = 1, message = "Maximum team members must be at least 1")
    private Integer maxTeamMembers;

    @Size(max = 4000)
    private String defaultRules;
}
