package com.sealhackathon.ranking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputeRequest {

    @NotBlank(message = "Reason is required")
    @Size(max = 2000)
    private String reason;
}
