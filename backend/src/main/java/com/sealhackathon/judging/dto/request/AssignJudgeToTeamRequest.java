package com.sealhackathon.judging.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AssignJudgeToTeamRequest {

    @NotNull(message = "Judge user ID is required")
    private UUID judgeUserId;
}
