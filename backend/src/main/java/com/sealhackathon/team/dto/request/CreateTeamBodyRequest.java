package com.sealhackathon.team.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateTeamBodyRequest {

    @NotBlank(message = "Team name is required")
    @Size(max = 255)
    private String name;
}
