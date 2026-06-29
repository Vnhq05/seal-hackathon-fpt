package com.sealhackathon.event.dto.response;

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
public class JudgeAssignmentResponse {

    private UUID id;
    private UUID roundId;
    private UUID trackId;
    private String trackName;
    private UUID judgeUserId;
    private String judgeFullName;
    private String judgeEmail;
    private LocalDateTime assignedAt;
}
