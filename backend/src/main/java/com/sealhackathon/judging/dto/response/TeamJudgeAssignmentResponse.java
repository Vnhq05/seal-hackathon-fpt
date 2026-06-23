package com.sealhackathon.judging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamJudgeAssignmentResponse {

    private UUID id;
    private UUID teamId;
    private UUID roundId;
    private UUID judgeUserId;
    private String judgeFullName;
    private LocalDateTime assignedAt;
}
