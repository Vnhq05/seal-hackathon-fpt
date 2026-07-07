package com.sealhackathon.event.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeactivateJudgeAssignmentRequest {

    @NotBlank(message = "Reason is required")
    private String reason;
}
