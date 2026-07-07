package com.sealhackathon.event.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplaceJudgeAssignmentRequest {

    @NotNull(message = "New judge user ID is required")
    private UUID newJudgeUserId;

    @NotBlank(message = "Reason is required")
    private String reason;
}
